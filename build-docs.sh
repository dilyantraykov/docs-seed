#!/bin/bash

config_file="_config.yml"	
if [ ! -z "$1" ]	
  then 	
    config_file+=",$1"
    echo "Using configuration from: $config_file"	
fi

debug_params=""
if [ ! -z "$2" ]
  then 
    debug_params=$2
    echo "Debug mode: $debug_params"
fi

rm -rf _site/ && rm -rf .sass-cache && rm -rf .jekyll-cache && rm -rf .asset-cache
docker pull tmitev/docs-seed:site
docker build -t tmitev/docs-seed:site .
docker run --rm --env CONFIG_FILE=$config_file --env JEKYLL_COMMAND=build --env JEKYLL_EXTRA=$debug_params -t -v "/$(pwd):/app_root" -t tmitev/docs-seed:site
