# Test Plan: Meal Tracking → Progress Tab Updates

## Steps to Test:

1. **Open the app and navigate to Progress tab**
   - Note the current weekly scores (fruits & veggies, protein, steps)
   - Check browser console for debug logs

2. **Navigate to Meals tab**
   - Add a new meal with:
     - Fruits & Veggies: 2 servings
     - Protein: 25 grams
   - Check console logs during meal addition

3. **Return to Progress tab**
   - Verify that the scores have updated:
     - Fruits & Veggies score should increase
     - Protein score should increase
   - Check console logs for score calculations

## Expected Debug Logs:

### When adding a meal:
```
Adding meal with data: { fruitsVeggies: 2, protein: 25, ... }
Meal added successfully, fetching meals...
Meals fetched, refreshing daily logs...
updateDailyLogFromMeals called for date: 2024-XX-XX
Aggregated nutrition for 2024-XX-XX: { protein: 25, fruitsVeggies: 2, ... }
Daily logs refreshed successfully
```

### When viewing Progress tab:
```
Progress tab: Meals changed, refreshing daily logs...
Progress tab: Calculating weekly score
Daily logs count: X
Week range: 2024-XX-XX to 2024-XX-XX
Relevant logs for this week: X
Log 2024-XX-XX: protein=25, fruitsVeggies=2, steps=0
getWeeklyScore called with: 2024-XX-XX to 2024-XX-XX
getWeeklyScore: Found X relevant logs
getWeeklyScore totals: { fruitsVeggiesTotal: 2, proteinTotal: 25, stepsTotal: 0 }
getWeeklyScore result: { fruitsVeggies: 40, protein: 25, steps: 0, overall: 21 }
Calculated weekly score: { fruitsVeggies: 40, protein: 25, steps: 0, overall: 21 }
```

## Score Calculations:
- **Fruits & Veggies**: 2 servings / 5 target = 40%
- **Protein**: 25g / 100g target = 25%
- **Steps**: 0 / 10,000 target = 0%
- **Overall**: (40 + 25 + 0) / 3 = 21% 