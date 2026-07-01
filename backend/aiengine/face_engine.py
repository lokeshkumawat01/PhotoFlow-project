"""
aiengine/face_engine.py

Yeh file 2 kaam karti hai:
1. Photo mein chehre dhundhna (detection)
2. Har chehre ka 512-d fingerprint banana (embedding)
"""

import os
import ctypes
import logging

logger = logging.getLogger(__name__)


def _add_nvidia_dll_paths():
    """
    pip se install ki gayi NVIDIA CUDA/cuDNN DLLs (cu12 packages) ko
    explicitly Windows DLL search path mein add karta hai, AUR unko
    explicitly ctypes se preload bhi karta hai (zaroori hai kyunki
    onnxruntime ki CUDA provider DLL lazy-load hoti hai aur
    add_dll_directory() ka effect Windows kabhi-kabhi miss kar deta hai).
    """
    try:
        import nvidia.cuda_runtime, nvidia.cublas, nvidia.cufft, nvidia.cudnn

        modules = [nvidia.cuda_runtime, nvidia.cublas, nvidia.cufft, nvidia.cudnn]
        bin_paths = []
        for module in modules:
            for base_path in module.__path__:
                bin_path = os.path.join(base_path, 'bin')
                if os.path.isdir(bin_path):
                    os.add_dll_directory(bin_path)
                    bin_paths.append(bin_path)

        load_order = [
            'cudart64_12.dll',
            'cublasLt64_12.dll',
            'cublas64_12.dll',
            'cufft64_11.dll',
            'cudnn64_9.dll',
            'cudnn_graph64_9.dll',
            'cudnn_heuristic64_9.dll',
            'cudnn_engines_precompiled64_9.dll',
            'cudnn_engines_runtime_compiled64_9.dll',
            'cudnn_engines_tensor_ir64_9.dll',
            'cudnn_ops64_9.dll',
            'cudnn_cnn64_9.dll',
            'cudnn_adv64_9.dll',
        ]
        for dll_name in load_order:
            for bin_path in bin_paths:
                full_path = os.path.join(bin_path, dll_name)
                if os.path.isfile(full_path):
                    try:
                        ctypes.WinDLL(full_path)
                    except OSError as e:
                        logger.warning(f"Failed to preload {dll_name}: {e}")
                    break

    except ImportError:
        pass  # Linux/production server pe yeh packages nahi honge, normal CUDA install use hoga


_add_nvidia_dll_paths()

import threading
import numpy as np

_model_lock = threading.Lock()
_face_app = None


def _get_providers():
    """GPU available hai to use karo, warna CPU pe fallback karo."""
    import onnxruntime as ort
    available = ort.get_available_providers()
    preferred = []
    if 'CUDAExecutionProvider' in available:
        preferred.append('CUDAExecutionProvider')
    preferred.append('CPUExecutionProvider')
    return preferred


def get_face_app():
    """
    InsightFace model ko load karta hai -- sirf ek baar (pehli call pe).
    Uske baad har call usi loaded model ko reuse karti hai (fast).
    """
    global _face_app
    if _face_app is not None:
        return _face_app

    with _model_lock:
        if _face_app is not None:
            return _face_app

        from insightface.app import FaceAnalysis

        providers = _get_providers()
        logger.info(f"Loading InsightFace model with providers: {providers}")

        app = FaceAnalysis(name='buffalo_l', providers=providers)
        app.prepare(ctx_id=0, det_size=(640, 640))

        _face_app = app
        return _face_app


class DetectedFace:
    """Ek detected chehre ka data -- fingerprint + location + confidence."""
    def __init__(self, embedding, bbox, confidence):
        self.embedding = embedding
        self.bbox = bbox
        self.confidence = confidence


def detect_and_embed_faces(image_bgr: np.ndarray) -> list[DetectedFace]:
    """
    Ek photo lo, usme jitne chehre hain sabka fingerprint nikal kar do.
    """
    app = get_face_app()
    faces = app.get(image_bgr)

    results = []
    for face in faces:
        x1, y1, x2, y2 = face.bbox.astype(int)
        w, h = x2 - x1, y2 - y1

        results.append(DetectedFace(
            embedding=face.normed_embedding,
            bbox=(int(x1), int(y1), int(w), int(h)),
            confidence=float(face.det_score),
        ))
    return results


def embed_single_face(image_bgr: np.ndarray):
    faces = detect_and_embed_faces(image_bgr)
    if not faces:
        return None

    img_height, img_width = image_bgr.shape[:2]
    center_x, center_y = img_width / 2, img_height / 2

    def distance_from_center(face):
        x, y, w, h = face.bbox
        face_center_x = x + w / 2
        face_center_y = y + h / 2
        return ((face_center_x - center_x) ** 2 + (face_center_y - center_y) ** 2) ** 0.5

    best = min(faces, key=distance_from_center)
    return best.embedding

def get_eye_aspect_ratio(landmarks_2d):
    import numpy as np

    # Left eye landmark indices (InsightFace 106-point scheme)
    left_eye_indices = [35, 36, 33, 37, 39, 40]
    eye_points = landmarks_2d[left_eye_indices]

    # Vertical distances (eyelid open/close)
    vertical_1 = np.linalg.norm(eye_points[1] - eye_points[5])
    vertical_2 = np.linalg.norm(eye_points[2] - eye_points[4])
    # Horizontal distance (eye corner to corner, stays constant)
    horizontal = np.linalg.norm(eye_points[0] - eye_points[3])

    if horizontal == 0:
        return 0.0

    ear = (vertical_1 + vertical_2) / (2.0 * horizontal)
    return float(ear)


def get_face_landmarks(image_bgr):
    app = get_face_app()
    faces = app.get(image_bgr)
    if not faces:
        return None

    img_height, img_width = image_bgr.shape[:2]
    center_x, center_y = img_width / 2, img_height / 2

    def distance_from_center(face):
        x1, y1, x2, y2 = face.bbox
        face_center_x = (x1 + x2) / 2
        face_center_y = (y1 + y2) / 2
        return ((face_center_x - center_x) ** 2 + (face_center_y - center_y) ** 2) ** 0.5

    best = min(faces, key=distance_from_center)
    return best.landmark_2d_106