import { BaseEdge, getStraightPath, type EdgeProps } from '@xyflow/react';

export default function SpouseEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  style,
  markerEnd,
}: EdgeProps) {
  const [edgePath] = getStraightPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
  });

  return (
    <BaseEdge
      id={id}
      path={edgePath}
      markerEnd={markerEnd}
      style={{
        stroke: '#BE123C',
        strokeWidth: 2,
        strokeDasharray: '6,5',
        ...style,
      }}
    />
  );
}