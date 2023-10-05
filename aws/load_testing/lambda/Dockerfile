FROM amazon/aws-lambda-python:3.11@sha256:f212b0e1bbab2fccccd27fcca66ae59e451ab58a221bcc7230587f1f007fe58e
COPY lambda_locust.py .
COPY tests ./tests
COPY requirements.txt .

RUN yum -y groupinstall "Development Tools"

RUN pip3 install --upgrade pip

RUN pip3 install -r requirements.txt

CMD ["lambda_locust.handler"]