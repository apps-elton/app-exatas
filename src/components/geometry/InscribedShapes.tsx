import React from 'react';
import { GeometryParams, VisualizationOptions, StyleOptions } from '@/types/geometry';
import AutoRotatingGroup from './AutoRotatingGroup';
import InscribedSphere from './inscribed/InscribedSphere';
import InscribedCube from './inscribed/InscribedCube';
import InscribedCylinder from './inscribed/InscribedCylinder';
import InscribedCone from './inscribed/InscribedCone';
import InscribedOctahedron from './inscribed/InscribedOctahedron';

interface InscribedShapesProps {
  params: GeometryParams;
  options: VisualizationOptions;
  style: StyleOptions;
}

export default function InscribedShapes({ params, options, style }: InscribedShapesProps) {
  return (
    <AutoRotatingGroup options={options} style={style}>
      <InscribedSphere params={params} options={options} style={style} />
      <InscribedCube params={params} options={options} style={style} />
      <InscribedCylinder params={params} options={options} style={style} />
      <InscribedCone params={params} options={options} style={style} />
      <InscribedOctahedron params={params} options={options} style={style} />
    </AutoRotatingGroup>
  );
}