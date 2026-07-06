from moviepy.editor import ImageClip, concatenate_videoclips

TARGET_W, TARGET_H = 1080, 1920  # vertical 9:16, matches Instagram/WhatsApp Status


def create_face_aware_video(frame_data: list, output_path: str, duration_per_image: float = 2.5):
    clips = []
    target_ratio = TARGET_W / TARGET_H

    for frame in frame_data:
        img_path = frame['path']
        bbox = frame['bbox']

        clip = ImageClip(img_path).set_duration(duration_per_image)
        clip_ratio = clip.w / clip.h

        if clip_ratio > target_ratio:
            # Image is wider than target -- crop the sides
            new_w = int(clip.h * target_ratio)
            x_center = clip.w / 2
            if bbox:
                x_center = bbox[0] + (bbox[2] / 2)

            x1 = max(0, min(clip.w - new_w, x_center - (new_w / 2)))
            x2 = x1 + new_w
            clip = clip.crop(x1=x1, y1=0, x2=x2, y2=clip.h)
        else:
            # Image is taller than target -- crop top/bottom
            new_h = int(clip.w / target_ratio)
            y_center = clip.h / 2
            if bbox:
                y_center = bbox[1] + (bbox[3] / 2)

            y1 = max(0, min(clip.h - new_h, y_center - (new_h / 2)))
            y2 = y1 + new_h
            clip = clip.crop(x1=0, y1=y1, x2=clip.w, y2=y2)

        clip = clip.resize((TARGET_W, TARGET_H))

        # Subtle zoom-in over the clip's duration (Ken Burns effect)
        clip = clip.resize(lambda t: 1.0 + 0.15 * (t / duration_per_image))
        clip = clip.crossfadein(0.5)

        clips.append(clip)

    final_video = concatenate_videoclips(clips, padding=-0.5, method="compose")

    final_video.write_videofile(
        output_path,
        fps=30,
        codec="libx264",
        audio=False,
        threads=4,
        preset="ultrafast",
        logger=None,  # suppress moviepy's verbose console output in Celery logs
    )

    final_video.close()
    for clip in clips:
        clip.close()