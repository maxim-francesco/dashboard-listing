
import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '@/components/ui/button';
import { X, GripVertical, RotateCcw, RotateCw } from 'lucide-react';

interface SortableImageProps {
  image: {
    id: string;
    url: string;
    rotation: number;
  };
  onDelete: (id: string) => void;
  onRotate: (direction: 'left' | 'right') => void;
}

export function SortableImage({ image, onDelete, onRotate }: SortableImageProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: image.id });
  
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    position: 'relative',
    overflow: 'hidden',
    touchAction: 'none', // Recommended for best UX on touch devices
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="aspect-square bg-muted rounded-md flex items-center justify-center overflow-hidden group">
      <img
        src={image.url}
        alt={`Imagine existentă`}
        className="w-full h-full object-cover transition-transform duration-200"
        style={{ transform: `rotate(${image.rotation}deg)` }}
      />
      <div 
        {...attributes} 
        {...listeners} 
        className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
      >
        <GripVertical className="w-8 h-8 text-white" />
      </div>
      <div className="absolute top-1 right-1 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          variant="destructive"
          size="icon"
          type="button"
          className="h-7 w-7"
          onClick={(e) => {
            e.stopPropagation(); // Prevent drag from starting
            onDelete(image.id);
          }}
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
      <div className="absolute bottom-1 left-1 right-1 flex justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
            variant="secondary"
            size="icon"
            type="button"
            className="h-7 w-7"
            onClick={(e) => {
                e.stopPropagation();
                onRotate('left');
            }}
        >
            <RotateCcw className="w-4 h-4" />
        </Button>
        <Button
            variant="secondary"
            size="icon"
            type="button"
            className="h-7 w-7"
            onClick={(e) => {
                e.stopPropagation();
                onRotate('right');
            }}
        >
            <RotateCw className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
