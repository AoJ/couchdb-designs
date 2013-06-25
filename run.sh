#!/bin/bash

ACTION=$2

mkdir --parents ./run

if [ $ACTION = status ]
then
  naught status ./run/$1.ipc
fi

if [ $ACTION = stop ]
then
  naught stop ./run/$1.ipc
fi

if [ $ACTION = deploy ]
then
  naught deploy ./run/$1.ipc
fi

if [ $ACTION = start ]
then
  naught start \
	--worker-count 1 \
    --ipc-file ./run/$1.ipc \
    --log ./run/$1.sys.log \
    --stdout ./run/$1.stdout.log \
    --stderr ./run/$1.stderr.log \
    --max-log-size 10485760 \
    --cwd . \
    $1.js $3
fi

