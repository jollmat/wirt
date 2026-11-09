export interface AlertsLiveEventInterface {
    id: number;
    type: string;
    city: string;
    slug: string;
    country: string;
    continent: string;
    lat: number;
    lon: number;
    location_precision: string;
    title: string;
    size: string;
    danger: number;
    verification: string;
    confidence: number;
    confidence_level: string;
    possibly_fake: boolean;
    source: string;
    first_seen: Date;
    last_seen: Date;
    expires: Date;
    url: string;
    sources: {
        domain: string;
        url: string;
        title: string;
    }[];
    official?: {
        provider: string;
        dataset: string;
        dataset_url: string;
        record_id: string;
        impact: string;
        level: string;
        start: Date,
        end: unknown,
        record_url: string;
        feed_url: string;
        license: string;
    }
}