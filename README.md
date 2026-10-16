this is a siple Simualtion Application using elastic beanstalk and javascript node js server. 

It simulate an IOT usecase with a websocket connection. In Porduction mostly data is sent mostly over kinesis oder otherwise and loaded through a adatbise. trhe server response to the client with data for monitoring.

the simulation shows the position of the rail and people who are tracked.

The simulation is hard coded on the server and dont connected to database. 

to use Create 2 buckets with unique names for application and templates in the railway-app.yml.

use the cloudformation creaeteion stack or cli and upload the files. 

you can also add youre domain and certs and health checks.

for the login u can use cognito with the dokumention implementation

As a iot connection the connection should be Server-Sent Events or MQTT to be efficent.

For the application updates its possible to combine gihtub actions and s3 which can be implemented with elastic beanstalk automatet deploy FOR BEst practice ist to use OIDC (OpenID Connect) to create a trust relation.
