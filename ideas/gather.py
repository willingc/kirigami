import orjson
import urllib3

http = urllib3.PoolManager()

resp = http.request("GET", "https://discuss.python.org/raw/31064/13")

print(f'status: {resp.status}')

print(resp.data)

print(type(resp.data))




print(orjson.loads((resp.data.decode( 'utf-8')))["json"])
