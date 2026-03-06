# First Time We have to run this command:
```
docker compose up --build
```

What will happen: 
Node image downloads 
Postgres image downloads 
Dependencies installed inside container 
DB container starts 
API container starts 

Your server runs on:
```
http://localhost:5000
```

# Daily Development Workflow
___
## After first build:
Start:
```
docker compose up
```

Stop:
```
docker compose down
```

View Logs:
```
docker compose logs -f
```

# Installing New Packages (Important)
DO NOT run npm install on your local machine.


Instead Run:
```
docker compose exec api sh
```

Then inside container
```
npm install express
```

Then run
```
exit
```

# How Hot Reload Works
Because if this:
```
volumes:
 - .:/app
```
When you edit files locally -> container see changes instantly.
If you are using ts-node-dev, it auto starts.
so development feels normal.

# Clearing and rebuilding the docker container

Clearning out the old volumes or corrupted volumes
```
docker system prune -a --volumes
```

Build image without catching the changes:
```
docker compose build --no-cache
```

Start the docker container with the image:
```
docker compose build --no-cache
```




