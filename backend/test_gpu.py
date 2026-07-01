import os
import sys

print("--- GPU TESTING SCRIPT ---")

# 1. CUDA x64 directory ko Python ke search path mein add karna
cuda_path = r"C:\Program Files\NVIDIA GPU Computing Toolkit\CUDA\v13.2\bin\x64"

if os.path.exists(cuda_path):
    os.add_dll_directory(cuda_path)
    print(f"[SUCCESS] CUDA path mil gaya aur add ho gaya: {cuda_path}")
else:
    print(f"[ERROR] CUDA path nahi mila! Is path ko check karein: {cuda_path}")

# 2. ONNX Runtime ko test karna
try:
    import onnxruntime as ort
    print(f"[SUCCESS] ONNX Runtime successfully import ho gaya.")
    print(f"ONNX Runtime Version: {ort.__version__}")
    
    # Yeh line sabse zaroori hai, yeh check karegi ki GPU available hai ya nahi
    providers = ort.get_available_providers()
    print(f"Available Providers: {providers}")
    
    if "CUDAExecutionProvider" in providers:
        print("\n🎉 MUBARAK HO! 'CUDAExecutionProvider' list mein aa gaya hai. Aapka GPU ab kaam karega!")
    else:
        print("\n❌ Gadbad hai! List mein 'CUDAExecutionProvider' nahi aaya. Sirf CPU dikh raha hai.")
        
except Exception as e:
    print("\n[ERROR] ONNX Runtime load nahi ho paya. Niche ka error dekho:")
    print(e)

print("--------------------------")