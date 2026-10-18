import {describe,expect,it} from 'vitest';
import {inspectAsciiStl,inspectObj} from '../modelInspector';

describe('CAD model inspection',()=>{
  it('reads OBJ vertices, faces and bounds',()=>{
    const result=inspectObj([
      'v 0 0 0',
      'v 4 0 0',
      'v 0 3 2',
      'f 1 2 3',
    ].join('\n'));

    expect(result.format).toBe('obj');
    expect(result.vertexCount).toBe(3);
    expect(result.triangleCount).toBe(1);
    expect(result.bounds?.size).toEqual([4,3,2]);
    expect(result.warnings).toEqual([]);
  });

  it('counts ASCII STL triangles from finite vertex records',()=>{
    const result=inspectAsciiStl([
      'solid sample',
      ' facet normal 0 0 1',
      '  outer loop',
      '   vertex 0 0 0',
      '   vertex 1 0 0',
      '   vertex 0 1 0',
      '  endloop',
      ' endfacet',
      'endsolid sample',
    ].join('\n'));

    expect(result.format).toBe('stl-ascii');
    expect(result.vertexCount).toBe(3);
    expect(result.triangleCount).toBe(1);
    expect(result.bounds?.size).toEqual([1,1,0]);
    expect(result.warnings).toEqual([]);
  });

  it('reports malformed OBJ data instead of claiming geometry was found',()=>{
    const result=inspectObj('not a vertex\nf 1 2 3');

    expect(result.vertexCount).toBe(0);
    expect(result.bounds).toBeUndefined();
    expect(result.warnings).toContain('No se detectaron vértices OBJ válidos.');
  });
});
