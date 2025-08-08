'use client';

/**
 * SaveTemplateModal Component
 * 
 * Modal for saving modified workout templates with ownership-based options.
 * Follows SupersetCreationModal pattern for consistency.
 * Mobile-optimized for gym environments.
 */

import React, { useState, useEffect } from 'react';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/powr-ui/primitives/Dialog';
import { Button } from '@/components/powr-ui/primitives/Button';
import { Input } from '@/components/powr-ui/primitives/Input';
import { Save, User, Users, Edit3 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ModificationAnalysis {
  isOwner: boolean;
  hasSignificantChanges: boolean;
  modificationSummary: string;
  totalChanges: number;
  canUpdateOriginal: boolean;
  canSaveAsNew: boolean;
}

interface WorkoutTemplate {
  id: string;
  name: string;
  authorPubkey: string;
  exercises?: any[];
}

interface SaveTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveTemplate: (saveType: 'new' | 'update', templateName?: string) => void;
  modificationAnalysis: ModificationAnalysis;
  originalTemplate: WorkoutTemplate;
  isOwner: boolean;
  suggestedName?: string;
  className?: string;
}

export const SaveTemplateModal: React.FC<SaveTemplateModalProps> = ({
  isOpen,
  onClose,
  onSaveTemplate,
  modificationAnalysis,
  originalTemplate,
  isOwner,
  suggestedName,
  className
}) => {
  const [templateName, setTemplateName] = useState('');
  const [saveType, setSaveType] = useState<'new' | 'update'>('new');

  // Initialize template name when modal opens
  useEffect(() => {
    if (isOpen) {
      const defaultName = suggestedName || `${originalTemplate.name} (Modified)`;
      setTemplateName(defaultName);
      setSaveType(isOwner ? 'new' : 'new'); // Default to 'new' even for owners
    }
  }, [isOpen, suggestedName, originalTemplate.name, isOwner]);

  const handleSave = () => {
    if (!templateName.trim()) {
      return; // Don't save without a name
    }
    
    onSaveTemplate(saveType, templateName.trim());
    onClose();
  };

  const handleClose = () => {
    setTemplateName('');
    setSaveType('new');
    onClose();
  };

  const isValidName = templateName.trim().length > 0;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent 
        className={cn(
          "w-[95vw] max-w-md sm:w-full sm:max-w-lg",
          "max-h-[80vh] flex flex-col",
          className
        )}
      >
        <DialogHeader className="flex-shrink-0 pb-3">
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <Save className="h-5 w-5 text-workout-active" />
            Save Modified Template
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {isOwner 
              ? "Update the original template or save as a new one"
              : "Save your customized version as a new template"
            }
          </DialogDescription>
        </DialogHeader>

        {/* Template Info and Modifications */}
        <div className="flex-1 overflow-y-auto py-3 space-y-4">
          {/* Original Template Info */}
          <div className="p-3 rounded-lg bg-muted/50 border">
            <div className="flex items-center gap-2 mb-2">
              {isOwner ? (
                <User className="h-4 w-4 text-workout-active" />
              ) : (
                <Users className="h-4 w-4 text-muted-foreground" />
              )}
              <span className="text-sm font-medium">
                {isOwner ? "Your Template" : "Original Template"}
              </span>
            </div>
            <div className="text-sm text-foreground font-medium">
              {originalTemplate.name}
            </div>
            {!isOwner && (
              <div className="text-xs text-muted-foreground mt-1">
                You're creating your own personal copy - the original stays unchanged
              </div>
            )}
          </div>

          {/* Modification Summary */}
          {modificationAnalysis.modificationSummary && (
            <div className="p-3 rounded-lg bg-workout-active/10 border border-workout-active/20">
              <div className="text-sm font-medium text-foreground mb-1">
                Your Changes
              </div>
              <div className="text-sm text-muted-foreground">
                {modificationAnalysis.modificationSummary}
              </div>
            </div>
          )}

          {/* Save Options */}
          {isOwner && (
            <div className="space-y-2">
              <div className="text-sm font-medium text-foreground mb-2">
                Save Options
              </div>
              
              {/* Update Original Option */}
              <div 
                className={cn(
                  "flex items-center space-x-3 py-2 px-3 rounded-lg border transition-colors cursor-pointer",
                  "min-h-[44px] touch-manipulation",
                  saveType === 'update' 
                    ? "bg-workout-active-bg border-workout-active-border" 
                    : "bg-background border-border hover:bg-muted/50"
                )}
                onClick={() => setSaveType('update')}
              >
                <div className={cn(
                  "w-4 h-4 rounded-full border-2 flex items-center justify-center",
                  saveType === 'update' 
                    ? "border-workout-active bg-workout-active" 
                    : "border-muted-foreground"
                )}>
                  {saveType === 'update' && (
                    <div className="w-2 h-2 rounded-full bg-white" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-foreground">
                    Update Original
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Replace the original template with your changes
                  </div>
                </div>
              </div>

              {/* Save as New Option */}
              <div 
                className={cn(
                  "flex items-center space-x-3 py-2 px-3 rounded-lg border transition-colors cursor-pointer",
                  "min-h-[44px] touch-manipulation",
                  saveType === 'new' 
                    ? "bg-workout-active-bg border-workout-active-border" 
                    : "bg-background border-border hover:bg-muted/50"
                )}
                onClick={() => setSaveType('new')}
              >
                <div className={cn(
                  "w-4 h-4 rounded-full border-2 flex items-center justify-center",
                  saveType === 'new' 
                    ? "border-workout-active bg-workout-active" 
                    : "border-muted-foreground"
                )}>
                  {saveType === 'new' && (
                    <div className="w-2 h-2 rounded-full bg-white" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-foreground">
                    Save as New
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Create a new template and keep the original unchanged
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Template Name Input */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Edit3 className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">
                Template Name
              </span>
            </div>
            <Input
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              placeholder="Enter template name..."
              className={cn(
                "min-h-[44px] touch-manipulation",
                !isValidName && "border-destructive"
              )}
              maxLength={100}
            />
            {!isValidName && (
              <div className="text-xs text-destructive">
                Template name is required
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <DialogFooter className="flex-shrink-0 pt-3">
          <div className="flex items-center justify-between gap-4 w-full">
            <Button
              variant="outline"
              onClick={handleClose}
              className="flex-1"
            >
              Cancel
            </Button>
            
            {isOwner && saveType === 'update' ? (
              <Button
                onClick={handleSave}
                disabled={!isValidName}
                className={cn(
                  "flex-1",
                  isValidName 
                    ? "bg-workout-active hover:bg-workout-active/90 text-white" 
                    : "opacity-50 cursor-not-allowed"
                )}
              >
                Update Original
              </Button>
            ) : (
              <Button
                onClick={handleSave}
                disabled={!isValidName}
                className={cn(
                  "flex-1",
                  isValidName 
                    ? "bg-workout-active hover:bg-workout-active/90 text-white" 
                    : "opacity-50 cursor-not-allowed"
                )}
              >
                Save as New
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

SaveTemplateModal.displayName = 'SaveTemplateModal';
