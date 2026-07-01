import numpy as np
from .face_engine import get_face_landmarks, get_eye_aspect_ratio

EAR_DROP_RATIO = 0.88


def check_blink_liveness(frames_bgr: list) -> dict:
    ear_values = []

    for frame in frames_bgr:
        landmarks = get_face_landmarks(frame)
        if landmarks is None:
            continue
        ear = get_eye_aspect_ratio(landmarks)
        ear_values.append(ear)

    if len(ear_values) < 3:
        return {"is_live": False, "reason": "Could not see your face clearly in enough frames."}

    baseline = max(ear_values)
    minimum = min(ear_values)

    if baseline == 0:
        return {"is_live": False, "reason": "Could not measure eye movement."}

    drop_ratio = minimum / baseline

    if drop_ratio <= EAR_DROP_RATIO:
        return {"is_live": True, "reason": "Blink detected."}

    return {
        "is_live": False,
        "reason": "No blink detected. Please look at the camera and blink naturally.",
    }

def check_blink_between_two_frames(prev_ear: float, current_ear: float) -> bool:
    if prev_ear == 0:
        return False
    drop_ratio = current_ear / prev_ear
    return drop_ratio <= EAR_DROP_RATIO


def get_ear_for_frame(frame_bgr) -> float | None:
    landmarks = get_face_landmarks(frame_bgr)
    if landmarks is None:
        return None
    return get_eye_aspect_ratio(landmarks)