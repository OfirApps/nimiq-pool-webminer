let run = (poolHost, poolPort, address, threads) => {
    (async () => {
        function loadScript(url) {
            return new Promise((resolve, reject) => {
                let script = document.createElement("script")
                if (script.readyState) {
                    script.onreadystatechange = () => {
                        if (script.readyState === "loaded" || script.readyState === "complete") {
                            script.onreadystatechange = null
                            resolve()
                        }
                    }
                } else {
                    script.onload = () => {
                        resolve()
                    }
                }

                script.src = url
                document.getElementsByTagName("head")[0].appendChild(script)
            })
        }

        let nimiqMiner = {
            shares: 0,
            init: () => {
                Nimiq.init(async () => {
                    if (typeof $ === 'undefined') {
                        let $ = {}
                        window.$ = $
                    }
                    Nimiq.GenesisConfig.main()
                    console.log('Nimiq loaded. Connecting and establishing consensus.')
                    $.consensus = await Nimiq.Consensus.nano()
                    $.blockchain = $.consensus.blockchain
                    $.accounts = $.blockchain.accounts
                    $.mempool = $.consensus.mempool
                    $.network = $.consensus.network

                    $.consensus.on('established', () => nimiqMiner._onConsensusEstablished())
                    $.consensus.on('lost', () => console.error('Consensus lost'))
                    $.blockchain.on('head-changed', () => nimiqMiner._onHeadChanged())
                    $.network.on('peers-changed', () => nimiqMiner._onPeersChanged())

                    $.network.connect()
                }, (code) => {
                    switch (code) {
                        case Nimiq.ERR_WAIT:
                            alert('Error: Already open in another tab or window.')
                            break
                        case Nimiq.ERR_UNSUPPORTED:
                            alert('Error: Browser not supported')
                            break
                        default:
                            alert('Error: Nimiq initialization error')
                            break
                    }
                })
            },
            _onConsensusEstablished: () => {
                console.log("Consensus established.")
                nimiqMiner.startMining()
            },
            _onHashrateChanged: (rate) => {
                console.log(`${rate} H/s`);
            },
            _onHeadChanged: () => {
                nimiqMiner.shares = 0;
            },
            _onPeersChanged: () => console.log(`Now connected to ${$.network.peerCount} peers.`),
            _onPoolConnectionChanged: (state) => {
                if (state === Nimiq.BasePoolMiner.ConnectionState.CONNECTING)
                    console.log('Connecting to the pool')
                if (state === Nimiq.BasePoolMiner.ConnectionState.CONNECTED) {
                    console.log('Connected to pool')
                    $.miner.startWork()
                    nimiqMiner.plsFixNimiqTeam();
                }
                if (state === Nimiq.BasePoolMiner.ConnectionState.CLOSED)
                    console.log('Connection closed')
            },
            _onShareFound: () => {
                nimiqMiner.shares++
                console.log(`Found ${nimiqMiner.shares} shares for block ${$.blockchain.height}`)
            },
            startMining: () => {
                console.log("Start mining...")
                nimiqMiner.address = Nimiq.Address.fromUserFriendlyAddress(address)
                //$.miner = new Nimiq.SmartPoolMiner($.blockchain, $.accounts, $.mempool, $.network.time, nimiqMiner.address, Nimiq.BasePoolMiner.generateDeviceId($.network.config))
                $.miner = new Nimiq.NanoPoolMiner($.blockchain, $.network.time, nimiqMiner.address, Nimiq.BasePoolMiner.generateDeviceId($.network.config));
                $.miner.threads = threads
                console.log(`Using ${$.miner.threads} threads.`)
                $.miner.connect(poolHost, poolPort)
                $.miner.on('connection-state', nimiqMiner._onPoolConnectionChanged)
                $.miner.on('share', nimiqMiner._onShareFound)
                $.miner.on("hashrate-changed", nimiqMiner._onHashrateChanged)
            },
            plsFixNimiqTeam: () => {
                let hack = setInterval(() => {
                    if (!$.miner._shouldWork) {
                        console.log("Pls fix");
                        $.miner.disconnect();
                        setTimeout(() => {
                            $.miner.connect(poolHost, poolPort);
                        }, 1000);
                    } else {
                        console.log("Quick fix by Albermonte hehe");
                        clearInterval(hack);
                    }
                }, 3000);
            }
        }

        await loadScript('https://unpkg.com/@nimiq/core-web@1.4.1/nimiq.js')
        console.log("Completed downloading Nimiq client from CDN.")
        nimiqMiner.init()
    })()
}

let PoolMiner = {
    init: (poolHost, poolPort, address, threads) => run(poolHost, poolPort, address, threads)
}