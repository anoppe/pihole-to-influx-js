export interface PiHoleApiModel {
    domains_being_blocked: number;
    dns_queries_today:     number;
    ads_blocked_today:     number;
    ads_percentage_today:  number;
    unique_domains:        number;
    queries_forwarded:     number;
    queries_cached:        number;
    clients_ever_seen:     number;
    unique_clients:        number;
    dns_queries_all_types: number;
    reply_NODATA:          number;
    reply_NXDOMAIN:        number;
    reply_CNAME:           number;
    reply_IP:              number;
    privacy_level:         number;
    status:                string;
    gravity_last_updated:  GravityLastUpdated;
}

export interface GravityLastUpdated {
    file_exists: boolean;
    absolute:    number;
    relative:    Relative;
}

export interface Relative {
    days:    string;
    hours:   string;
    minutes: string;
}
