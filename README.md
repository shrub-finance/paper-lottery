# paper-lottery

To reproduce results of the paper lottery:
```
# node 16

npm i

# this is using the hash of polygon block 23695500 as stated ahead of time on discord and twitter
node paper-lottery.js groups.json 0xeeef74155303e520e7d9b604a7e66929fc079a80697dd07257de68051274aafb

# results will be written to address-index-map.json where there is a map of whitelisted addresses to seed tokenIds
```

To verify checksums:
```
shasum groups.json paper-lottery.js

# 38f2f164c99e0821f3034bd54246cb15d4ffeb7f  groups.json
# fe5d11ccc2055d4c73a1ba4bde38f2923122be47  paper-lottery.js
```
