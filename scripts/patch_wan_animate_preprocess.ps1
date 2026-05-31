param(
    [string]$RootPath = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
)

$NodeFile = Join-Path $RootPath "ComfyUI\custom_nodes\ComfyUI-WanAnimatePreprocess\nodes.py"
if (-not (Test-Path $NodeFile)) {
    Write-Host "[WanAnimate patch] Node file not found, skipping: $NodeFile" -ForegroundColor Yellow
    exit 0
}

$Text = Get-Content -Raw $NodeFile
if ($Text -match "Invalid face bbox on frame") {
    Write-Host "[WanAnimate patch] Already applied." -ForegroundColor Green
    exit 0
}

$Old = @'
        for idx, meta in enumerate(pose_metas):
            face_bbox_for_image = get_face_bboxes(meta['keypoints_face'][:, :2], scale=1.3, image_shape=(H, W))
            x1, x2, y1, y2 = face_bbox_for_image
'@

$New = @'
        for idx, meta in enumerate(pose_metas):
            try:
                face_bbox_for_image = get_face_bboxes(meta['keypoints_face'][:, :2], scale=1.3, image_shape=(H, W))
                if not np.all(np.isfinite(face_bbox_for_image)):
                    raise ValueError("non-finite face bbox")
            except Exception as exc:
                logging.warning(f"Invalid face bbox on frame {idx}: {exc}. Using fallback crop.")
                fallback_size = max(16, int(min(H, W) * 0.3))
                fallback_x1 = max(0, (W - fallback_size) // 2)
                fallback_x2 = min(W, fallback_x1 + fallback_size)
                fallback_y1 = max(0, int(H * 0.1))
                fallback_y2 = min(H, fallback_y1 + fallback_size)
                face_bbox_for_image = [fallback_x1, fallback_x2, fallback_y1, fallback_y2]
            x1, x2, y1, y2 = face_bbox_for_image
'@

if (-not $Text.Contains($Old)) {
    Write-Host "[WanAnimate patch] Expected block not found, skipping." -ForegroundColor Yellow
    exit 0
}

$Text = $Text.Replace($Old, $New)
Set-Content -Path $NodeFile -Value $Text -Encoding UTF8
Write-Host "[WanAnimate patch] Applied face bbox fallback." -ForegroundColor Green
