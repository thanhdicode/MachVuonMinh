"""Derive our small atlas from public-domain Natural Earth; no runtime requests."""
import json, math, urllib.request
from pathlib import Path

url = 'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_10m_admin_0_countries.geojson'
data = json.load(urllib.request.urlopen(url))

def simplify(points, tolerance=.012):
    if len(points) < 3:
        return points
    ax, ay = points[0][:2]; bx, by = points[-1][:2]
    denom = (bx-ax)**2 + (by-ay)**2
    distances = []
    for x,y,*_ in points[1:-1]:
        t = max(0, min(1, ((x-ax)*(bx-ax)+(y-ay)*(by-ay))/denom)) if denom else 0
        distances.append(math.hypot(x-ax-t*(bx-ax),y-ay-t*(by-ay)))
    maximum = max(distances, default=0)
    if maximum <= tolerance:
        return [points[0],points[-1]]
    i = distances.index(maximum)+1
    return simplify(points[:i+1],tolerance)[:-1]+simplify(points[i:],tolerance)

def project(p):
    # Equirectangular at 16N, same projection for mainland and offshore locators.
    return [round(45+(p[0]-102)*34.6,2),round(35+(24-p[1])*36,2)]

output = {}
island_points = {'HSA':[], 'TSA':[]}
for feature in data['features']:
    geo=feature['geometry']; polys=geo['coordinates'] if geo['type']=='MultiPolygon' else [geo['coordinates']]
    for poly in polys:
        ring=poly[0]
        lon=sum(p[0] for p in ring)/len(ring);lat=sum(p[1] for p in ring)/len(ring)
        if 111<lon<113 and 15.75<lat<17.25:
            island_points['HSA'].append(project([lon,lat]))
        elif feature['properties']['ADM0_A3'] == 'PGA':
            island_points['TSA'].append(project([lon,lat]))
for feature in data['features']:
    code = feature['properties']['ADM0_A3']
    if code not in ('VNM','LAO','KHM','CHN','THA'):
        continue
    geo=feature['geometry']; polys=geo['coordinates'] if geo['type']=='MultiPolygon' else [geo['coordinates']]
    paths=[]
    for poly in polys:
        ring=poly[0]
        if not any(100<x<118 and 6<y<26 for x,y,*_ in ring): continue
        pts=[project(p) for p in simplify(ring)]
        if len(pts)>3:
            paths.append('M'+'L'.join(f'{x},{y}' for x,y in pts)+'Z')
    output[code]=''.join(paths)
assert output['VNM'].count('M') > 10, 'Retain mainland and coastal islands'
output.update(island_points)
Path('src/data/vietnam-map.json').write_text(json.dumps(output,separators=(',',':')),encoding='utf-8')
print('Atlas paths / island points:', {k:len(v) for k,v in output.items()})
