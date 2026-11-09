import { EarthquakePerception, MagnitudeType } from "../../../services/seismic-metrics-service";

export interface EarthquakeFeatureUsgsInterface {
    geometry: { type: string, coordinates: number[]};
    id: string;
    properties: {
        alert: unknown;
        cdi: unknown;
        code: string;
        detail: string;
        dmin: number;
        felt: unknown;
        gap: number;
        ids: string;
        mag: number;
        magType: MagnitudeType;
        magTypeDesc?: string;
        mmi: unknown;
        perception?: EarthquakePerception;
        net: string;
        nst: number;
        place: string;
        rms: number;
        sig: number;
        sources: string;
        status: string;
        time: Date;
        title: string;
        tsunami: number;
        type: string;
        types: string;
        tz: unknown;
        updated: Date;
        url: string;
    }
}