import 'dart:io';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:fecos_mobile/app/theme/app_theme.dart';

class PhotoCaptureWidget extends StatelessWidget {
  const PhotoCaptureWidget({
    super.key,
    required this.photos,
    required this.onAdd,
    required this.onRemove,
    this.maxPhotos = 5,
  });

  final List<String> photos;
  final ValueChanged<String> onAdd;
  final ValueChanged<int> onRemove;
  final int maxPhotos;

  Future<void> _pick(ImageSource source) async {
    final picked = await ImagePicker().pickImage(
      source: source,
      imageQuality: 80,
      maxWidth: 1280,
    );
    if (picked != null) onAdd(picked.path);
  }

  @override
  Widget build(BuildContext context) => Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Photos',
              style: TextStyle(
                  fontWeight: FontWeight.w600, color: AppColors.textSecondary)),
          const SizedBox(height: 8),
          SizedBox(
            height: 100,
            child: ListView(
              scrollDirection: Axis.horizontal,
              children: [
                ...List.generate(photos.length, (i) => _PhotoThumb(
                      path: photos[i],
                      onRemove: () => onRemove(i),
                    )),
                if (photos.length < maxPhotos)
                  _AddPhotoButton(onPick: _pick),
              ],
            ),
          ),
        ],
      );
}

class _PhotoThumb extends StatelessWidget {
  const _PhotoThumb({required this.path, required this.onRemove});

  final String path;
  final VoidCallback onRemove;

  @override
  Widget build(BuildContext context) => Padding(
        padding: const EdgeInsets.only(right: 8),
        child: Stack(
          children: [
            ClipRRect(
              borderRadius: BorderRadius.circular(8),
              child: Image.file(File(path),
                  width: 90, height: 90, fit: BoxFit.cover),
            ),
            Positioned(
              top: 2,
              right: 2,
              child: GestureDetector(
                onTap: onRemove,
                child: Container(
                  decoration: const BoxDecoration(
                      color: AppColors.danger, shape: BoxShape.circle),
                  padding: const EdgeInsets.all(2),
                  child: const Icon(Icons.close, size: 12, color: Colors.white),
                ),
              ),
            ),
          ],
        ),
      );
}

class _AddPhotoButton extends StatelessWidget {
  const _AddPhotoButton({required this.onPick});

  final Future<void> Function(ImageSource) onPick;

  @override
  Widget build(BuildContext context) => GestureDetector(
        onTap: () => showModalBottomSheet<void>(
          context: context,
          builder: (_) => SafeArea(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                ListTile(
                  leading: const Icon(Icons.camera_alt),
                  title: const Text('Camera'),
                  onTap: () {
                    Navigator.pop(context);
                    onPick(ImageSource.camera);
                  },
                ),
                ListTile(
                  leading: const Icon(Icons.photo_library),
                  title: const Text('Gallery'),
                  onTap: () {
                    Navigator.pop(context);
                    onPick(ImageSource.gallery);
                  },
                ),
              ],
            ),
          ),
        ),
        child: Container(
          width: 90,
          height: 90,
          decoration: BoxDecoration(
            border: Border.all(color: AppColors.border, width: 2),
            borderRadius: BorderRadius.circular(8),
            color: AppColors.surface,
          ),
          child: const Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.add_a_photo, color: AppColors.primary, size: 28),
              SizedBox(height: 4),
              Text('Add',
                  style: TextStyle(fontSize: 11, color: AppColors.textSecondary)),
            ],
          ),
        ),
      );
}
