import { Customer, TeethChartState, ToothNumber } from '../types';

export function createDefaultTeethChart(): TeethChartState {
  const chart: TeethChartState = {} as TeethChartState;
  for (let i = 1; i <= 32; i++) {
    chart[i as ToothNumber] = {
      number: i as ToothNumber,
      condition: 'healthy',
      surfaces: [],
      notes: '',
      mobility: 0,
      pocketDepthMm: 2,
    };
  }
  return chart;
}

export const INITIAL_CUSTOMERS: Customer[] = [];
