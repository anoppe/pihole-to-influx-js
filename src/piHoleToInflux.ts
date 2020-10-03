#!/usr/bin/env node

import Axios from "axios";
import {PiHoleApiModel} from "./piHoleApiModel";
import {InfluxDB, Point, HttpError} from "@influxdata/influxdb-client"
import {WriteApi, WritePrecision} from "@influxdata/influxdb-client/dist";

const INFLUX_URL = process.env.INFLUX_URL || "http://localhost:8086";
const INFLUX_TOKEN = process.env.INFLUX_TOKEN || "";
const INFLUX_ORG = process.env.INFLUX_ORG || "";
const INFLUX_BUCKET = process.env.INFLUX_BUCKET || "pihole";
const INFLUX_MEASUREMENT_NAME = process.env.INFLUX_MEASUREMENT_NAME || "pihole";
const PIHOLE_URL = process.env.PIHOLE_URL || "";
const SCRAPE_INTERVAL = Number(process.env.SCRAPE_INTERVAL) || 60000

export class PiHoleToInflux {

    private influxClient: WriteApi;
    private interval: NodeJS.Timeout | undefined;

    constructor() {
        PiHoleToInflux.validateVariables();
        this.influxClient = PiHoleToInflux.createInfluxWriteApi();
    }

    private static createInfluxWriteApi(): WriteApi {
        return new InfluxDB({
            url: INFLUX_URL,
            token: INFLUX_TOKEN
        }).getWriteApi(INFLUX_ORG, INFLUX_BUCKET, WritePrecision.s)
    }

    private async getPiHoleData(): Promise<PiHoleApiModel> {
        return await Axios.get<PiHoleApiModel>(PIHOLE_URL).then(value => {
            return <PiHoleApiModel>value.data;
        });
    }

    public start() {
        console.log("Application to forward PiHole metrics to InfluxDB started");
        console.log(`Forwarding at an interval of ${SCRAPE_INTERVAL/1000} seconds`)
        this.interval = setInterval(() => {
            console.debug("Starting data scraping")
            this.getPiHoleData().then(piHoleApiModel => {
                this.handlePiHoleResponse(piHoleApiModel);
            }).catch(reason => {
                console.error(`An error occurred requesting pihole data: ${reason}`);
            });
        }, SCRAPE_INTERVAL);
    }

    public stop(signal: NodeJS.Signals) {
        console.log(`Stop signal received: ${signal}`);
        if (this.interval) {
            clearInterval(this.interval);
            process.exit(0);
        }
    }

    private handlePiHoleResponse(piHoleApiModel: PiHoleApiModel) {
        console.debug("converting pihole response to influx points");

        let {dnsQueriesToday, gravityUpdatedTimestamp} = PiHoleToInflux.convertToInfluxModel(piHoleApiModel);

        console.debug("writing points to InfluxDB");

        this.influxClient.writePoint(dnsQueriesToday);
        this.influxClient.writePoint(gravityUpdatedTimestamp)

        this.influxClient.flush(true)
            .catch(reason => {
                console.error(`Error occurred writing data to InfluxDB: ${reason}`);
            });
    }

    private static convertToInfluxModel(piHoleApiModel: PiHoleApiModel) {
        let dnsQueriesToday = new Point(INFLUX_MEASUREMENT_NAME)
            .floatField("domains_being_blocked", piHoleApiModel.domains_being_blocked)
            .floatField("dns_queries_today", piHoleApiModel.dns_queries_today)
            .floatField("ads_blocked_today", piHoleApiModel.ads_blocked_today)
            .floatField("ads_percentage_today", piHoleApiModel.ads_percentage_today)
            .floatField("unique_domains", piHoleApiModel.unique_domains)
            .floatField("queries_forwarded", piHoleApiModel.queries_forwarded)
            .floatField("queries_cached", piHoleApiModel.queries_forwarded)
            .floatField("clients_ever_seen", piHoleApiModel.clients_ever_seen)
            .floatField("unique_clients", piHoleApiModel.unique_clients)
            .floatField("dns_queries_all_types", piHoleApiModel.dns_queries_all_types)
            .floatField("reply_no_data", piHoleApiModel.reply_NODATA)
            .floatField("reply_nx_domain", piHoleApiModel.reply_NXDOMAIN)
            .floatField("reply_CNAME", piHoleApiModel.reply_CNAME)
            .floatField("reply_IP", piHoleApiModel.reply_IP)
            .floatField("status", piHoleApiModel.status === 'enabled' ? 1 : 0)

        let gravityUpdatedTimestamp = new Point(INFLUX_MEASUREMENT_NAME)
            .intField("gravity_last_updated", 1)
            .timestamp(piHoleApiModel.gravity_last_updated.absolute);
        return {dnsQueriesToday, gravityUpdatedTimestamp};
    }

    private static validateVariables() {

        let isInvalid = false;

        if (!process.env.INFLUX_TOKEN) {
            isInvalid = true;
            console.error(`Required InfluxDB token missing. Current value: INFLUX_TOKEN=${process.env.INFLUX_TOKEN}.`);
        }
        if (!process.env.INFLUX_ORG) {
            isInvalid = true;
            console.error(`Influx organisation missing. Current value INFLUX_ORG=${process.env.INFLUX_ORG}`);
        }
        if (!process.env.PIHOLE_URL) {
            isInvalid = true;
            console.error(`Pihole url missing. PIHOLE_URL=${process.env.PIHOLE_URL}`);
        }

        if (isInvalid) {
            process.exit(1);
        }
    }
}

let piHoleToInflux = new PiHoleToInflux();
process.on("SIGTERM", signal => {
    console.log('SIGTERM received');
    piHoleToInflux.stop(signal);
});
process.on("SIGINT", signal => {
    console.log('SIGINT received');
    piHoleToInflux.stop(signal);
});
piHoleToInflux.start();

