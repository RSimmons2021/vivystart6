# Weekly Score Target Updates

## Summary of Changes

Updated the weekly score calculation in `store/health-store.ts` to use more realistic and achievable weekly targets based on current health recommendations from WHO, CDC, and American Heart Association. **The scores are now calculated based on weekly totals rather than daily averages.**

## Previous vs. Updated Targets

### **Fruits & Vegetables**
- **Previous**: 5 servings/day (35 servings/week)
- **Updated**: 4.5 servings/day (31.5 servings/week)
- **Calculation**: Weekly total ÷ 31.5 servings × 100%
- **Rationale**: American Heart Association recommends 2.5 cups vegetables + 2 cups fruit daily. This is more achievable than the previous 5 servings target.

### **Protein**
- **Previous**: 100g/day (700g/week)
- **Updated**: 80g/day (560g/week)
- **Calculation**: Weekly total ÷ 560g × 100%
- **Rationale**: More realistic for average adults. Based on 1.2-1.6g/kg body weight for a 50-70kg person. The previous 100g target was quite high for many users.

### **Daily Steps**
- **Previous**: 10,000 steps/day (70,000 steps/week)
- **Updated**: 8,000 steps/day (56,000 steps/week)
- **Calculation**: Weekly total ÷ 56,000 steps × 100%
- **Rationale**: CDC research shows health benefits plateau around 8,000-10,000 steps. Studies indicate significant mortality reduction at 8,000 steps, making this more achievable while still providing substantial health benefits.

## Key Change: Weekly vs Daily Calculation

### **Previous Method (Daily Average)**
- Calculated average daily intake over the week
- Compared daily average to daily target
- Example: If user had 20 servings total over 5 days = 4 servings/day average
- Score: (4 ÷ 4.5) × 100% = 89%

### **New Method (Weekly Total)**
- Calculates total weekly intake
- Compares weekly total to weekly target
- Example: If user had 20 servings total over the week
- Score: (20 ÷ 31.5) × 100% = 63%

### **Why This Change Matters**
1. **More Accurate**: Reflects actual weekly progress rather than theoretical daily averages
2. **Realistic Expectations**: Shows true progress toward weekly health goals
3. **Better Motivation**: Users can see exactly how much they need to reach weekly targets
4. **Flexible**: Allows for variation in daily intake while tracking weekly consistency

## Health Research Supporting These Changes

### Fruits & Vegetables (31.5 servings/week)
- **American Heart Association**: Recommends 2.5 cups vegetables + 2 cups fruit daily
- **Dietary Guidelines for Americans 2020-2025**: Similar recommendations for a 2,000-calorie diet
- More realistic and sustainable for long-term adherence

### Protein (560g/week)
- **WHO/FAO**: Recommends 0.8-1.2g/kg body weight for adults
- **Sports nutrition**: 1.2-1.6g/kg for active individuals
- 80g/day represents a good target for a 50-70kg adult (average weight range)

### Steps (56,000/week)
- **CDC Research**: Benefits plateau around 8,000-10,000 steps
- **Studies show**: 8,000 steps provides 60% reduction in mortality risk
- **WHO**: Recommends 150 minutes moderate activity weekly (roughly equivalent to 7,000-8,000 steps)
- More achievable than 10,000 steps while maintaining significant health benefits

## Impact on User Experience

1. **More Realistic Scores**: Weekly totals provide more accurate progress tracking
2. **Better Goal Understanding**: Users see exactly how much they need for the week
3. **Flexible Daily Intake**: Can have higher/lower days while tracking weekly progress
4. **Sustained Engagement**: Realistic weekly targets prevent discouragement
5. **Health Benefits Maintained**: Targets still provide significant health improvements when achieved

## Implementation

The changes are implemented in the `getWeeklyScore` function in `store/health-store.ts`:

```typescript
// Calculate weekly targets (7 days):
// - Fruits & Veggies: 4.5 servings/day × 7 days = 31.5 servings/week
// - Protein: 80g/day × 7 days = 560g/week
// - Steps: 8,000 steps/day × 7 days = 56,000 steps/week

const weeklyFruitsVeggiesTarget = 4.5 * 7; // 31.5 servings/week
const weeklyProteinTarget = 80 * 7; // 560g/week
const weeklyStepsTarget = 8000 * 7; // 56,000 steps/week

// Calculate scores as percentage of weekly targets
const fruitsVeggiesScore = Math.min(100, (fruitsVeggiesTotal / weeklyFruitsVeggiesTarget) * 100);
const proteinScore = Math.min(100, (proteinTotal / weeklyProteinTarget) * 100);
const stepsScore = Math.min(100, (stepsTotal / weeklyStepsTarget) * 100);
```

These changes make the progress tracking more encouraging and realistic while still promoting healthy lifestyle habits based on weekly achievement rather than daily averages. 