import 'package:flutter/material.dart';
import 'package:fecos_mobile/app/theme/app_theme.dart';

class FecosShimmer extends StatefulWidget {
  const FecosShimmer({
    super.key,
    this.height = 80,
    this.width,
    this.borderRadius = 10,
  });

  final double height;
  final double? width;
  final double borderRadius;

  @override
  State<FecosShimmer> createState() => _FecosShimmerState();
}

class _FecosShimmerState extends State<FecosShimmer>
    with SingleTickerProviderStateMixin {
  late final AnimationController _ctrl;
  late final Animation<double> _anim;

  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1400),
    )..repeat();
    _anim = Tween<double>(begin: -2.0, end: 2.0)
        .animate(CurvedAnimation(parent: _ctrl, curve: Curves.easeInOut));
  }

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => AnimatedBuilder(
        animation: _anim,
        builder: (_, __) => Container(
          height: widget.height,
          width: widget.width ?? double.infinity,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(widget.borderRadius),
            gradient: LinearGradient(
              begin: Alignment(_anim.value - 1, 0),
              end: Alignment(_anim.value, 0),
              colors: const [
                AppColors.border,
                Color(0xFFF0E8E5),
                AppColors.border,
              ],
            ),
          ),
        ),
      );
}

// Card-shaped shimmer — white card with shimmer lines inside
class FecosShimmerCard extends StatelessWidget {
  const FecosShimmerCard({
    super.key,
    this.height = 100,
    this.lineCount = 2,
  });

  final double height;
  final int lineCount;

  @override
  Widget build(BuildContext context) => Container(
        height: height,
        decoration: BoxDecoration(
          color: AppColors.surfaceCard,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: AppColors.border),
        ),
        padding: const EdgeInsets.all(16),
        child: ClipRect(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            FecosShimmer(height: 13, width: 130, borderRadius: 4),
            for (int i = 0; i < lineCount; i++) ...[
              const SizedBox(height: 9),
              FecosShimmer(
                height: 11,
                width: i == lineCount - 1 ? 180 : double.infinity,
                borderRadius: 4,
              ),
            ],
          ],
        ),
        ),
      );
}

// Row of small shimmer stat boxes
class FecosShimmerStatRow extends StatelessWidget {
  const FecosShimmerStatRow({super.key, this.count = 3});
  final int count;

  @override
  Widget build(BuildContext context) => Row(
        children: List.generate(count, (i) => Expanded(
              child: Padding(
                padding: EdgeInsets.only(left: i == 0 ? 0 : 10),
                child: Container(
                  height: 76,
                  decoration: BoxDecoration(
                    color: AppColors.surfaceCard,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: AppColors.border),
                  ),
                  padding: const EdgeInsets.all(12),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      FecosShimmer(height: 18, width: 40, borderRadius: 4),
                      const SizedBox(height: 6),
                      FecosShimmer(height: 10, borderRadius: 4),
                    ],
                  ),
                ),
              ),
            )),
      );
}

// Full list of shimmer cards
class FecosListShimmer extends StatelessWidget {
  const FecosListShimmer({super.key, this.itemCount = 5, this.itemHeight = 90});
  final int itemCount;
  final double itemHeight;

  @override
  Widget build(BuildContext context) => ListView.separated(
        padding: const EdgeInsets.all(16),
        itemCount: itemCount,
        separatorBuilder: (_, __) => const SizedBox(height: 12),
        itemBuilder: (_, __) => FecosShimmerCard(height: itemHeight),
      );
}
