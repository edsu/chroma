#!/usr/bin/env python

import sys
import json
import time
import random
import requests

for line in open("searches.txt"):
    url = line.strip()
    update = {
        "userAgent": "mozilla",
        "url": url
    }
    data = json.dumps(update)
    requests.post("http://localhost:8080/update", data=data, 
        headers={"content-type": "application/json"})
    time.sleep(random.randint(0, 7))
