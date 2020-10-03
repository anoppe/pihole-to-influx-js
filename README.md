# pihole-to-influx-js
Application to forward [Pihole](https://pi-hole.net) statistics to [InfluxDB](https://influxdata.com).

Tested against Pihole v4.4 and InfluxDB v2.0.0-beta and InfluxDB v1.8.3

# Getting started
There is a docker image available on [hub.docker.com](https://hub.docker.com) which can be pulled to run.
```
$ docker pull anoppe/pihole-to-influx-js
$ docker run \
  -e INFLUX_URL=http://localhost:8086 \
  -e INFLUX_TOKEN= \
  -e INFLUX_ORG=some_org \
  -e PIHOLE_URL=http://localhost:8080/admin/api.php \
  anoppe/pihole-to-influx-js
```

Available variables to configure the container:
* `INFLUX_URL` - The url of your InfluxDB instance. Defaults to `http://localhost:8086`.
* `INFLUX_TOKEN` - The access token to authenticate with InfluxDB. Please refer to the [InfluxDB documentation](https://docs.influxdata.com/influxdb/v2.0/security/tokens/) on how to obtain a token.
    To authenticate with InfluxDB v1.8.x the value of this variable is `<username>:<password>`.
* `INFLUX_ORG` - The InfluxDB organisation to connect with. Must be empty when connecting to InfluxDB v1.8.x
* `INFLUX_BUCKET` - The InfluxDB bucket to write the Pi-hole statistics to. Defaults to `pihole`. When connecting to InfluxDB 1.8.x, the value of this variable is `<databasename>/<retentionpolicy>`
* `INFLUX_MEASUREMENT_NAME` - The name of the InfluxDB measurement. Defaults to `pihole`.
* `PIHOLE_URL` - The url of the pi hole api. e.g. `http://localhost:8080/admin/api.php`
