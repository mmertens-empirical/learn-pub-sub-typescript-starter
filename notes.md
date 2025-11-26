# Docker build from ./

`docker build -t rabbitmq-stomp .`

# Docker run after Docker build

`docker run -d --name rabbitmq-stomp -p 5672:5672 -p 15672:15672 -p 61613:61613 rabbi
tmq-stomp`
