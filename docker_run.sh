#!/bin/bash

DOCKER_NAME=mypq_svr
POSTGRES_DB=db_follow
# POSTGRES_USER=myuser
# POSTGRES_PASSWORD=mypasswd
PGDATA=/data/pg_data
DB_PORT=5432


mkdir -p $PGDATA
docker run -v $PGDATA:/data -v /root:/root -d --restart always --name DOCKER_NAME -e PGDATA=/data -e POSTGRES_DB=mydb -e POSTGRES_USER=POSTGRES_USER  -e POSTGRES_PASSWORD=$POSTGRES_PASSWORD -p $DB_PORT:5432 postgres:14 

cp ./misc/pgsql.sql /root/

# docker exec -it $DOCKER_NAME /bin/bash
# createdb -h localhost -p 5432 -U POSTGRES_USER POSTGRES_DB
docker exec -e PGPASSWORD=$POSTGRES_PASSWORD DOCKER_NAME createdb -h localhost -p 5432 -U POSTGRES_USER POSTGRES_DB
# psql -U POSTGRES_USER -w -h localhost -p 5432 -d POSTGRES_DB
docker exec -e PGPASSWORD=$POSTGRES_PASSWORD DOCKER_NAME psql -U POSTGRES_USER -w -h localhost -p 5432 -d POSTGRES_DB -a -f /root/pssql.sql
