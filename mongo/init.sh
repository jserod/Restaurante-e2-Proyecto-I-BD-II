#!/bin/bash
set -e

echo "========================================="
echo "  MongoDB Sharded Cluster Initialization"
echo "========================================="

# -------------------------------------------------
# Función: espera hasta que un MongoDB responda
# -------------------------------------------------
wait_mongo() {
    local host=$1
    local port=$2
    local label=${3:-"$host:$port"}
    local max=40
    local i=1

    echo "  Esperando $label..."
    until mongosh --host "$host" --port "$port" --eval "db.version()" --quiet &>/dev/null; do
        if [ $i -ge $max ]; then
            echo "  ERROR: $label no respondió después de ${max} intentos"
            exit 1
        fi
        sleep 2
        ((i++))
    done
    echo "  ✓ $label listo"
}

# -------------------------------------------------
# 1. Esperar config servers
# -------------------------------------------------
echo ""
echo "[1/5] Esperando config servers..."
wait_mongo mongo-config1 27019 "mongo-config1:27019"
wait_mongo mongo-config2 27019 "mongo-config2:27019"
wait_mongo mongo-config3 27019 "mongo-config3:27019"

# -------------------------------------------------
# 2. Iniciar replica set de config
# -------------------------------------------------
echo ""
echo "[2/5] Inicializando Config Replica Set..."
mongosh --host mongo-config1 --port 27019 --quiet <<EOF
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

# Esperar a que el config tenga un PRIMARY
echo "  Esperando que configReplSet tenga PRIMARY..."
until mongosh --host mongo-config1 --port 27019 --eval "
    var status = rs.status();
    if (status.myState === 1) quit(0); else quit(1);
" --quiet 2>/dev/null; do
    sleep 3
done
echo "  ✓ Config Replica Set tiene PRIMARY"

# -------------------------------------------------
# 3. Esperar shard servers
# -------------------------------------------------
echo ""
echo "[3/5] Esperando shard servers..."
wait_mongo mongo-shard1-a 27018 "mongo-shard1-a:27018"
wait_mongo mongo-shard1-b 27018 "mongo-shard1-b:27018"
wait_mongo mongo-shard1-c 27018 "mongo-shard1-c:27018"

# -------------------------------------------------
# 4. Iniciar replica set de shard
# -------------------------------------------------
echo ""
echo "[4/5] Inicializando Shard Replica Set..."
mongosh --host mongo-shard1-a --port 27018 --quiet <<EOF
rs.initiate({
  _id: "shard1ReplSet",
  members: [
    { _id: 0, host: "mongo-shard1-a:27018" },
    { _id: 1, host: "mongo-shard1-b:27018" },
    { _id: 2, host: "mongo-shard1-c:27018" }
  ]
})
EOF

# Esperar a que el shard tenga un PRIMARY
echo "  Esperando que shard1ReplSet tenga PRIMARY..."
until mongosh --host mongo-shard1-a --port 27018 --eval "
    var status = rs.status();
    if (status.myState === 1) quit(0); else quit(1);
" --quiet 2>/dev/null; do
    sleep 3
done
echo "  ✓ Shard Replica Set tiene PRIMARY"

# -------------------------------------------------
# 5. Esperar router y agregar shard
# -------------------------------------------------
echo ""
echo "[5/5] Esperando router y configurando sharding..."
wait_mongo mongo-router 27017 "mongo-router:27017"

# Agregar el shard
echo "  Agregando shard al router..."
mongosh --host mongo-router --port 27017 --quiet <<EOF
sh.addShard("shard1ReplSet/mongo-shard1-a:27018,mongo-shard1-b:27018,mongo-shard1-c:27018")
EOF
echo "  ✓ Shard agregado"

# Habilitar sharding y shardear colecciones
echo "  Habilitando sharding en 'restaurant'..."
mongosh --host mongo-router --port 27017 --quiet <<EOF
sh.enableSharding("restaurant")

sh.shardCollection("restaurant.reservations", { "user_id": "hashed" })
sh.shardCollection("restaurant.orders", { "user_id": "hashed" })
sh.shardCollection("restaurant.restaurants", { "_id": "hashed" })
sh.shardCollection("restaurant.users", { "keycloak_id": "hashed" })
EOF
echo "  ✓ Sharding habilitado y colecciones shardeadas"

echo ""
echo "========================================="
echo "  MongoDB Sharded Cluster Listo"
echo "========================================="