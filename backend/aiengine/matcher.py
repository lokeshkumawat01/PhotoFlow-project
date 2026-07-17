import numpy as np
from photos.models import FaceEmbedding
from pgvector.django import CosineDistance
from events.models import VIPProfile, VideoAccessProfile

VIP_MATCH_THRESHOLD = 0.6
VIDEO_ACCESS_MATCH_THRESHOLD = 0.6
GUEST_MATCH_THRESHOLD = 0.6

def find_matching_photos(event_id: str, query_embedding, threshold: float = 0.45):
    # pgvector's CosineDistance gives a DISTANCE (0 = identical, 2 = opposite),
    # not a similarity score, so we convert: similarity = 1 - distance.
    max_distance = 1 - threshold

    from pgvector.django import CosineDistance

    faces = (
        FaceEmbedding.objects
        .filter(photo__event_id=event_id)
        .annotate(distance=CosineDistance('embedding', query_embedding))
        .filter(distance__lte=max_distance)
        .select_related('photo')
        .order_by('distance')
    )

    best_per_photo = {}
    for face in faces:
        photo_id = str(face.photo_id)
        similarity = 1 - face.distance
        # Keep only the best (highest similarity) match per photo, in
        # case a guest's face was detected more than once in one image.
        if photo_id not in best_per_photo or similarity > best_per_photo[photo_id]:
            best_per_photo[photo_id] = similarity

    results = [{'photo_id': pid, 'similarity': sim} for pid, sim in best_per_photo.items()]
    results.sort(key=lambda r: r['similarity'], reverse=True)
    return results

def match_vip(guest_embedding, event_id):
    closest_vip = (
        VIPProfile.objects
        .filter(event_id=event_id)
        .annotate(distance=CosineDistance('reference_embedding', guest_embedding))
        .order_by('distance')
        .first()
    )

    if closest_vip is not None and closest_vip.distance <= VIP_MATCH_THRESHOLD:
        return closest_vip

    return None

def match_video_access(guest_embedding, event_id):
    closest = (
        VideoAccessProfile.objects
        .filter(event_id=event_id)
        .annotate(distance=CosineDistance('reference_embedding', guest_embedding))
        .order_by('distance')
        .first()
    )

    if closest is not None and closest.distance <= VIDEO_ACCESS_MATCH_THRESHOLD:
        return closest

    return None

def match_guests_for_new_photo(event_id, face_embeddings):
    from guests.models import Guest
 
    guests = list(
        Guest.objects.filter(event_id=event_id, is_vip=False)
        .exclude(selfie_embedding__isnull=True)
    )
 
    matched_guest_ids = []
    for guest in guests:
        guest_vec = np.array(guest.selfie_embedding)
        for face_vec in face_embeddings:
            similarity = float(np.dot(guest_vec, np.array(face_vec)))
            distance = 1 - similarity
            if distance <= GUEST_MATCH_THRESHOLD:
                matched_guest_ids.append(guest.id)
                break  # this guest matched one face in the photo, no need to check the rest
 
    return matched_guest_ids
 
 
def add_photo_to_matched_guests(photo_id: str, matched_guest_ids: list):
    from django.db import transaction
    from guests.models import Guest
 
    with transaction.atomic():
        for guest_id in matched_guest_ids:
            guest = Guest.objects.select_for_update().get(id=guest_id)
            if photo_id not in guest.matched_photo_ids:
                guest.matched_photo_ids.append(photo_id)
                guest.save(update_fields=['matched_photo_ids'])
 