#!/bin/bash
set -e

echo "Esperando que los config servers estén listos..."
sleep 15

echo "Iniciando replica set de config servers..."
mongosh --host mongo-config1 --port 27019 <<EOF
rs.initiate({
  _id: "configReplSet",
  configsvr: true,
  members: [
    { _id: 0, host: "mongo-config1:27019" },
    { _id: 1, host: "mongo-config2:27019" },
    { _id: 2, host: "mongo-config3:27019" }
  ]
})
EOF

echo "Esperando que el config replica set esté listo..."
sleep 10

echo "Iniciando replica set del shard 1..."
mongosh --host mongo-shard1-a --port 27018 <<EOF
rs.initiate({
  _id: "shard1ReplSet",
  members: [
    { _id: 0, host: "mongo-shard1-a:27018" },
    { _id: 1, host: "mongo-shard1-b:27018" },
    { _id: 2, host: "mongo-shard1-c:27018" }
  ]
})
EOF

echo "Esperando que el shard replica set esté listo..."
sleep 10

echo "Esperando que el router esté listo..."
sleep 10

echo "Agregando shard al router..."
mongosh --host mongo-router --port 27017 <<EOF
sh.addShard("shard1ReplSet/mongo-shard1-a:27018,mongo-shard1-b:27018,mongo-shard1-c:27018")
EOF

echo "Habilitando sharding en la base de datos restaurant..."
mongosh --host mongo-router --port 27017 <<EOF
sh.enableSharding("restaurant")

sh.shardCollection("restaurant.menus", { "restaurant_id": "hashed" })
sh.shardCollection("restaurant.reservations", { "user_id": "hashed" })
sh.shardCollection("restaurant.orders", { "user_id": "hashed" })
sh.shardCollection("restaurant.restaurants", { "_id": "hashed" })
sh.shardCollection("restaurant.users", { "keycloak_id": "hashed" })
EOF

echo "MongoDB sharding configurado correctamente"