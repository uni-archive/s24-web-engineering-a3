import { expectStatus, expectBodyJSON, expectEquality } from './jest-tuwien';
import { testApp, sendRequest } from './util';

describe('/mats', () => {

  testApp(501, 'Mat colors', async (steps) => {
    const res = await sendRequest(steps, { path: '/mats' } );
    expectStatus(steps, res, 200);
    const body = expectBodyJSON(steps, res);
    steps.push('expect response to contain the correct mat colors');
    expectEquality(body, [
        { color: "mint", label: "Mint", hex: "#F5FFFA" },
        { color: "periwinkle", label: "Periwinkle", hex: "#CCCCFF" },
        { color: "cerulean", label: "Cerulean", hex: "#407899" },
        { color: "burgundy", label: "Burgundy", hex: "#800020" },
        { color: "coal", label: "Coal", hex: "#495D6A" }
    ]);
  });

});
