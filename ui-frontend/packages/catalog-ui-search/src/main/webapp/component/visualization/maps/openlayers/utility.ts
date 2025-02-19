/**
 * Copyright (c) Codice Foundation
 *
 * This is free software: you can redistribute it and/or modify it under the terms of the GNU Lesser
 * General Public License as published by the Free Software Foundation, either version 3 of the
 * License, or any later version.
 *
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without
 * even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
 * Lesser General Public License for more details. A copy of the GNU Lesser General Public License
 * is distributed along with this program and can be found at
 * <http://www.gnu.org/licenses/lgpl.html>.
 *
 **/
import _ from 'lodash'
import * as Turf from '@turf/turf'
import { GeometryJSON } from 'geospatialdraw/target/webapp/geometry'
import { StartupDataStore } from '../../../../js/model/Startup/startup'
import { transform as projTransform } from 'ol/proj'
import { boundingExtent, getCenter } from 'ol/extent'
function convertPointCoordinate(point: any) {
  const coords = [point[0], point[1]]
  return projTransform(
    coords as any,
    'EPSG:4326',
    StartupDataStore.Configuration.getProjection()
  )
}
function unconvertPointCoordinate(point: any) {
  return projTransform(
    point,
    StartupDataStore.Configuration.getProjection(),
    'EPSG:4326'
  )
}
/*
  A variety of helpful functions for dealing with Openlayers
*/
export default {
  /*
        Calculates the center of given a geometry (WKT)
      */
  calculateOpenlayersCenterOfGeometry(propertyModel: any) {
    const lineObject = propertyModel
      .getPoints()
      .map((coordinate: any) => convertPointCoordinate(coordinate))
    const extent = boundingExtent(lineObject)
    return getCenter(extent)
  },
  /*
        Calculates the center of given a geometry (WKT)
      */
  calculateCartographicCenterOfGeometryInDegrees(propertyModel: any) {
    const openlayersCenter =
      this.calculateOpenlayersCenterOfGeometry(propertyModel)
    return unconvertPointCoordinate(openlayersCenter)
  },
  /*
        Calculates the center of given geometries (WKT)
      */
  calculateOpenlayersCenterOfGeometries(propertyModels: any) {
    const allPoints = _.flatten(
      propertyModels.map((propertyModel: any) => propertyModel.getPoints())
    ).map((coordinate) => convertPointCoordinate(coordinate))
    const extent = boundingExtent(allPoints)
    return getCenter(extent)
  },
  /*
        Calculates the center of given geometries (WKT)
      */
  calculateCartographicCenterOfGeometriesInDegrees(propertyModels: any) {
    const openlayersCenter =
      this.calculateOpenlayersCenterOfGeometries(propertyModels)
    return unconvertPointCoordinate(openlayersCenter)
  },
  convertCoordsToDisplay(coordinates: GeoJSON.Position[]) {
    const coords = _.cloneDeep(coordinates)
    coords.forEach((coord) => {
      if (coord[0] < 0) {
        coord[0] += 360
      }
    })
    return coords
  },
  adjustGeoCoords(geo: GeometryJSON) {
    const geometry = geo.geometry
    const bbox = geo.bbox || Turf.bbox(geo.geometry)
    const width = Math.abs(bbox[0] - bbox[2])
    const crossesAntiMeridian = width > 180
    if (crossesAntiMeridian) {
      if (geo.properties.shape === 'Line') {
        const lineStringCoords = (geometry as GeoJSON.LineString).coordinates
        geometry.coordinates = this.convertCoordsToDisplay(lineStringCoords)
      } else if (
        geo.properties.shape === 'Bounding Box' ||
        geo.properties.shape === 'Polygon'
      ) {
        const coords = (geometry as GeoJSON.Polygon).coordinates[0]
        geometry.coordinates[0] = this.convertCoordsToDisplay(coords)
      }
    }
  },
}
