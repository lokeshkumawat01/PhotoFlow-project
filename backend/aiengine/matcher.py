from photos.models import FaceEmbedding


def find_matching_photos(event_id: str, query_embedding, threshold: float = 0.45):
    """
    event_id: which event's photos to search within
    query_embedding: the guest's selfie embedding (numpy array or list, 512 numbers)
    threshold: minimum similarity to count as a match (0 to 1, higher = stricter)

    Returns: list of dicts [{'photo_id': ..., 'similarity': ...}, ...]
    sorted by similarity, highest first.
    """
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