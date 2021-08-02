# Multisend

App to run multiple transactions using a Merkle distributor contract.

## How to run

To test multisend locally you can have to run:

`yarn`
`yarn dev:baklava`

You can specify in which network you will run.

## Distribution

To generate the package for local installation you have to run:

`yarn dist`

That will generate inside of the ./dist folder the different installables.

## How to use MultiSend

Once started we only need a csv that has the following format:

Address, amount, recipient(optional)

Example:

```
0x0Cc59Ed03B3e763c02d54D695FFE353055f1502D,0.01,Company 1
0x111a3C92DA13F19A68975c4a196B40d416277946,0.02,Company 2
```