For starting project you need to install Docker

after that go to the main folder and run next command 

sudo docker-compose up --build --force-recreate --no-deps -d &&  sudo docker logs platincoin -f

If you ned to import database:

Create a file db_platincoin_orders.json inside the container. After that copy data from db_platincoin_orders.json in root of the project and paste this data inside the container in file db_platincoin_orders.

sudo docker exec -it <your db_platincoin container id> 

apt-get update

apt-get install nano 

nano db_platincoin_orders.json

paste data from db_platincoin_orders.json in your root directory
saave and exit
ctrl+o ctrl+x

after that exit from container:

exit

run next coomand in your server terminal: 

sudo docker exec -it <your db_platincoin container id>  mongoimport --db platincoin-order  --collection orders --file db_platincoin_orders --jsonArray
 
after that go to the main folder and run next command again:

sudo docker-compose up --build --force-recreate --no-deps -d &&  sudo docker logs platincoin -f

make sure that you succseffuly connected to database. You ned to see the next message in console: Successfully connected to MongoDB

If connection to data base failed. You need to know on which Ip address started your db_platincoin container 
docker inspect db_platincoin and find fiel IPAddress. 
After that go to db/mongo.js and change mongodb://172.18.0.3 on andress that you will find in docker inspect info.
Or just change address to mongodb://172.18.0.3 . Usualy it works

