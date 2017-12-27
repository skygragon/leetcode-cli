FROM node:alpine
LABEL maintainer="skygragon@gmail.com"

COPY src.tar.gz /
RUN mkdir -p /tmp/leetcode-cli && \
    cd /tmp/leetcode-cli && \
    tar zxf /src.tar.gz && \
    npm install && \
    tar zcf /leetcode-cli.tar.gz . && \
    rm -rf /tmp/leetcode-cli /src.tar.gz

VOLUME ["/root"]
WORKDIR /root
COPY entrypoint /
ENTRYPOINT ["/entrypoint"]
