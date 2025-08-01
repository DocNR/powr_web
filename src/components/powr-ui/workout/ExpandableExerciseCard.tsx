import { useState } from 'react';
import { ChevronDown, ChevronUp, Info, ChevronRight } from 'lucide-react';

interface PersonalRecord {
  oneRM?: number;
  maxWeight?: number;
  maxVolume?: number;
}

interface Exercise {
  name: string;
  sets?: number;
  reps?: number;
  description?: string;
  // New fields for expanded functionality
  gifUrl?: string;
  personalRecords?: PersonalRecord;
  muscleGroups?: string[];
  equipment?: string;
  difficulty?: string;
}

interface ExpandableExerciseCardProps {
  exercise: Exercise;
  index: number;
  onExerciseClick?: (exercise: Exercise) => void;
}

export const ExpandableExerciseCard = ({ 
  exercise, 
  index, 
  onExerciseClick 
}: ExpandableExerciseCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleCardClick = () => {
    if (onExerciseClick) {
      onExerciseClick(exercise);
    } else {
      setIsExpanded(!isExpanded);
    }
  };

  const hasExpandableContent = exercise.gifUrl || 
                              exercise.personalRecords || 
                              exercise.muscleGroups?.length || 
                              exercise.equipment || 
                              exercise.difficulty;

  return (
    <div className="bg-muted/50 backdrop-blur-sm rounded-lg p-4 overflow-hidden transition-all duration-300 ease-in-out">
      {/* Collapsed State - Always Visible */}
      <div 
        className={`transition-colors ${
          hasExpandableContent ? 'cursor-pointer hover:bg-muted/40 active:bg-muted/50' : ''
        }`}
        onClick={handleCardClick}
      >
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2 flex-1">
            <h4 className="font-semibold text-foreground">
              {exercise.name || `Exercise ${index + 1}`}
            </h4>
            {hasExpandableContent && (
              <div className="flex items-center gap-1 text-muted-foreground">
                {onExerciseClick ? (
                  <>
                    <Info className="h-4 w-4" />
                    <ChevronRight className="h-4 w-4" />
                  </>
                ) : (
                  isExpanded ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )
                )}
              </div>
            )}
          </div>
          <span className="text-orange-500 text-sm font-medium">
            {exercise.sets || 3} × {exercise.reps || 12}
          </span>
        </div>
        <p className="text-muted-foreground text-sm">
          {exercise.description || (hasExpandableContent ? 'Tap for details' : 'No additional details available')}
        </p>
      </div>

      {/* Expanded State - Only show if not using onExerciseClick and has content */}
      {!onExerciseClick && isExpanded && hasExpandableContent && (
        <div className="border-t border-border mt-4 pt-4 space-y-4 animate-in slide-in-from-top-2 duration-300">
          {/* GIF/Video Section */}
          {exercise.gifUrl && (
            <div className="space-y-2">
              <h5 className="font-medium text-foreground flex items-center gap-2">
                🎬 Exercise Demo
              </h5>
              <div className="rounded-lg overflow-hidden bg-muted/30">
                <img
                  src={exercise.gifUrl}
                  alt={`${exercise.name} demonstration`}
                  className="w-full h-48 object-cover"
                  loading="lazy"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                  }}
                />
              </div>
            </div>
          )}

          {/* Personal Records Section */}
          {exercise.personalRecords && (
            <div className="space-y-2">
              <h5 className="font-medium text-foreground flex items-center gap-2">
                📊 Personal Records
              </h5>
              <div className="space-y-1">
                {exercise.personalRecords.oneRM && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">1RM:</span>
                    <span className="font-medium">{exercise.personalRecords.oneRM} lbs</span>
                  </div>
                )}
                {exercise.personalRecords.maxWeight && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Max Weight:</span>
                    <span className="font-medium">{exercise.personalRecords.maxWeight} lbs</span>
                  </div>
                )}
                {exercise.personalRecords.maxVolume && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Max Volume:</span>
                    <span className="font-medium">{exercise.personalRecords.maxVolume} lbs</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Exercise Details Section */}
          <div className="space-y-2">
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Muscle Groups:</span>
                <span className="font-medium">
                  {exercise.muscleGroups?.length 
                    ? exercise.muscleGroups.join(', ') 
                    : '-'
                  }
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Equipment:</span>
                <span className="font-medium">
                  {exercise.equipment || '-'}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Difficulty:</span>
                <span className="font-medium">
                  {exercise.difficulty || '-'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
