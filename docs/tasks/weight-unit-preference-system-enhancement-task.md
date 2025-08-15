# Weight Unit Preference System Enhancement Task

## Brief Overview
Enhance the weight unit preference system to provide better discoverability through a settings drawer while maintaining quick workout access, and fix components that aren't respecting user weight unit preferences.

## Current State Analysis

### ✅ Working Components
- **SetRow**: Properly uses `useWeightUnits` hook for real-time conversion
- **WorkoutSummaryModal**: Respects weight unit preference in social sharing
- **SocialSharingService**: Accepts weight unit parameter for content generation
- **WorkoutMenuDropdown**: Provides weight unit toggle during workouts
- **WeightUnitsProvider**: Global React Context with localStorage persistence
- **useWeightUnits hook**: Clean API for accessing/updating preference
- **Weight conversion utilities**: Robust conversion and formatting functions

### ❌ Broken Components
- **WorkoutHistoryDetailModal**: Hardcoded "kg" labels, doesn't use weight unit preference
  - Line ~180: `{Math.round(processedWorkout.stats.totalVolume)} kg` (hardcoded)
  - Line ~220: `{Math.round(exercise.totalVolume)} kg` (hardcoded)
  - Timeline weight display may not respect user preference

### 🔍 Unknown Status
- **WorkoutAnalyticsService**: Timeline generation may need weight unit awareness
- **Other components**: Need audit to ensure comprehensive coverage

## Technical Approach

### Phase 1: Fix Broken Components (Priority: HIGH)
**Immediate Issue**: WorkoutHistoryDetailModal shows incorrect units

#### 1.1 Update WorkoutHistoryDetailModal
```typescript
// Add weight unit hook
import { useWeightUnits } from '@/providers/WeightUnitsProvider';
import { convertWeightForDisplay, formatWeightDisplay } from '@/lib/utils/weightConversion';

const { weightUnit } = useWeightUnits();

// Convert hardcoded displays
const displayVolume = convertWeightForDisplay(processedWorkout.stats.totalVolume, weightUnit);
const volumeLabel = formatWeightDisplay(displayVolume, weightUnit);
```

**Files to modify:**
- `src/components/powr-ui/workout/WorkoutHistoryDetailModal.tsx`

### Phase 2: Add Settings Drawer Integration (Priority: MEDIUM)
**Goal**: Better UX and discoverability through dedicated settings

#### 2.1 Create Settings Components
```typescript
// New components structure
src/components/powr-ui/settings/
├── SettingsDrawer.tsx          // Main settings container
├── WeightUnitToggle.tsx        // Reusable toggle component
└── WorkoutPreferencesSection.tsx // Workout-specific settings
```

#### 2.2 Settings UI Structure
- **Account Settings**
- **Workout Preferences**
  - Weight Units (kg/lbs) ← New addition
  - Default rest times (future)
  - RPE scale preference (future)
- **App Settings**
  - Theme (future dark mode)
  - Notifications (future)

#### 2.3 Integration Points
- Add settings trigger in `AppHeader.tsx`
- Keep existing `WorkoutMenuDropdown` toggle for quick access
- Both locations use same `useWeightUnits` hook → instant synchronization

### Phase 3: Comprehensive Audit (Priority: LOW)
**Goal**: Ensure all weight displays respect user preference

#### 3.1 Component Audit Checklist
- [ ] SetRow ✅ (already working)
- [ ] WorkoutSummaryModal ✅ (already working)
- [ ] SocialSharingService ✅ (already working)
- [ ] WorkoutHistoryDetailModal (Phase 1 fix)
- [ ] WorkoutMenuDropdown ✅ (already working)
- [ ] Settings components (Phase 2)
- [ ] Any other components displaying weights?

#### 3.2 Service Layer Audit
- [ ] SocialSharingService ✅ (already working)
- [ ] WorkoutAnalyticsService timeline generation
- [ ] Any other services displaying weights?

## Implementation Steps

### Phase 1: Immediate Fix (30 minutes)
1. **Import weight unit utilities** in WorkoutHistoryDetailModal
2. **Add useWeightUnits hook** to component
3. **Convert hardcoded volume displays** using conversion utilities
4. **Update hardcoded "kg" labels** to be dynamic
5. **Test weight unit toggle** affects history modal correctly

### Phase 2: Settings Integration (2-3 hours)
1. **Create SettingsDrawer component** with proper UI structure
2. **Create reusable WeightUnitToggle** component
3. **Add settings trigger** in app header or navigation
4. **Test synchronization** between settings and workout toggles
5. **Verify localStorage persistence** works from both locations

### Phase 3: Quality Assurance (1 hour)
1. **Audit all components** that display weights
2. **Test comprehensive coverage** across the app
3. **Verify edge cases** (app restart, preference persistence)
4. **Document any additional components** that need updates

## Success Criteria

### Phase 1 Success
- [ ] WorkoutHistoryDetailModal displays weights in user's preferred unit
- [ ] Volume labels show correct unit (kg/lbs) dynamically
- [ ] Timeline weight display respects user preference
- [ ] No hardcoded "kg" labels remain in the component

### Phase 2 Success
- [ ] Settings drawer provides weight unit toggle
- [ ] Settings toggle synchronizes instantly with workout toggle
- [ ] Both locations save preference to localStorage
- [ ] Settings drawer is accessible from main navigation
- [ ] UI follows consistent design patterns

### Phase 3 Success
- [ ] All weight displays across the app respect user preference
- [ ] Preference persists across app restarts
- [ ] No components display hardcoded weight units
- [ ] Comprehensive test coverage validates all scenarios

## Architecture Benefits

### Current Architecture Strengths
✅ **Global State Management**: React Context provides single source of truth  
✅ **Instant Synchronization**: All components update immediately when preference changes  
✅ **Persistent Storage**: localStorage automatically saves user preference  
✅ **Clean API**: `useWeightUnits` hook provides simple access pattern  
✅ **Robust Utilities**: Weight conversion functions handle edge cases properly  

### Enhancement Benefits
✅ **Better Discoverability**: Settings drawer makes preference obvious  
✅ **Dual Access**: Settings for discovery + workout menu for convenience  
✅ **Consistent UX**: Global preference works everywhere instantly  
✅ **Future-Ready**: Settings drawer ready for additional preferences  
✅ **No Refactoring**: Current architecture supports enhancement seamlessly  

## User Experience Flow

### Settings Discovery Flow
1. User opens Settings drawer from main navigation
2. Finds "Workout Preferences" section
3. Toggles weight unit preference (kg ↔ lbs)
4. **Instantly**: All weight displays across app update to new unit
5. Preference automatically saved to localStorage

### Quick Workout Access Flow
1. User is mid-workout, sees weights in kg
2. Opens WorkoutMenuDropdown
3. Toggles to lbs for quick comparison
4. **Instantly**: Current workout, history, sharing all update to lbs
5. Same preference saved, affects settings drawer too

### Persistence Flow
1. User closes app after setting preference to lbs
2. Reopens app later
3. **Automatically**: All components load with lbs preference
4. No re-configuration needed

## Testing Plan

### Phase 1 Testing
- [ ] Open WorkoutHistoryDetailModal with kg preference → shows kg
- [ ] Toggle to lbs in WorkoutMenuDropdown → history modal updates to lbs
- [ ] Restart app → history modal remembers lbs preference
- [ ] Test with various workout data (bodyweight, weighted exercises)

### Phase 2 Testing
- [ ] Open settings drawer → weight unit toggle present
- [ ] Toggle in settings → workout components update instantly
- [ ] Toggle in workout menu → settings drawer reflects change
- [ ] Test localStorage persistence from both locations

### Phase 3 Testing
- [ ] Comprehensive app walkthrough with preference changes
- [ ] Test all weight-displaying components
- [ ] Verify edge cases (empty data, zero weights, decimal weights)
- [ ] Performance testing (no unnecessary re-renders)

## Technical Notes

### No Architecture Changes Needed
The current `WeightUnitsProvider` + `useWeightUnits` architecture is perfect for this enhancement:
- Global state management ✅
- Instant synchronization ✅  
- Persistent storage ✅
- Clean component API ✅

### Reusable Component Pattern
```typescript
// WeightUnitToggle.tsx - Reusable in settings and workout menu
const WeightUnitToggle = ({ variant = 'default' }) => {
  const { weightUnit, setWeightUnit } = useWeightUnits();
  
  return (
    <Toggle
      value={weightUnit}
      onChange={setWeightUnit}
      options={[
        { value: 'kg', label: 'Kilograms (kg)' },
        { value: 'lbs', label: 'Pounds (lbs)' }
      ]}
      variant={variant}
    />
  );
};
```

### Integration Points
- **Settings Drawer**: Primary location for preference discovery
- **WorkoutMenuDropdown**: Secondary location for quick workout access
- **AppHeader**: Settings trigger (gear icon or menu)
- **All weight-displaying components**: Use `useWeightUnits` hook

## Effort Estimation
- **Phase 1**: 30 minutes (simple hook integration)
- **Phase 2**: 2-3 hours (new settings UI components)  
- **Phase 3**: 1 hour (audit and comprehensive testing)

**Total Effort**: ~4 hours for complete implementation

## Priority Justification

### High Priority (Phase 1)
- **User Impact**: WorkoutHistoryDetailModal currently shows wrong units
- **Data Integrity**: Users see incorrect weight information
- **Quick Fix**: Simple hook integration, minimal risk

### Medium Priority (Phase 2)
- **UX Improvement**: Better discoverability of preference
- **User Feedback**: Settings are expected location for preferences
- **Foundation**: Prepares for future preference additions

### Low Priority (Phase 3)
- **Quality Assurance**: Ensures comprehensive coverage
- **Edge Cases**: Handles uncommon scenarios
- **Documentation**: Maintains system integrity

## Future Enhancements

### Additional Workout Preferences
- Default rest timer duration
- RPE scale preference (1-10 vs 0-10)
- Default workout type
- Auto-save frequency

### Settings Drawer Expansion
- Account management
- Theme preferences (dark mode)
- Notification settings
- Data export/import

### Advanced Weight Features
- Multiple unit support (kg, lbs, stones)
- Decimal precision preferences
- Weight progression tracking
- Personal records in preferred units

---

**Created**: 2025-08-15  
**Priority**: Medium (not part of beta cleanup sprint)  
**Effort**: ~4 hours  
**Dependencies**: None (current architecture supports enhancement)  
**Risk Level**: Low (additive enhancement, no breaking changes)
