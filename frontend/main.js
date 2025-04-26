// ----- Token and Network Configuration -----
const SOL_MINT = "So11111111111111111111111111111111111111112"; // SOL Mint Address
const CRL_MINT = "9AtC4cXKs7XUGCsoxPcEuMeig68MJwHpn6LXQCgF19DY"; // CRL Mint Address
const BACKEND_URL = "https://criptolag.onrender.com"; // Change to your deployed backend URL when live

let publicKey = null;

async function connectWallet() {
    const walletStatus = document.getElementById("walletStatus");
    const connectButton = document.getElementById("connectWallet");
    const disconnectButton = document.getElementById("disconnectWallet");

    connectButton.style.display = "none";        // hide Connect
    disconnectButton.style.display = "inline-block"; // show Disconnect

    walletStatus.textContent = "Connecting...";

    try {
        if (!window.solana || !window.solana.isPhantom) {
            throw new Error("Phantom Wallet not found! Install it from https://phantom.app");
        }

        const provider = window.solana;
        const response = await provider.connect();
        publicKey = response.publicKey;

        walletStatus.textContent = `Connected: ${publicKey.toString()}`;
        connectButton.style.display = "none";        // hide Connect
        disconnectButton.style.display = "inline-block"; // show Disconnect

        if (!window.phantomEventListenersAttached) {
            window.solana.on("connect", onPhantomConnect);
            window.solana.on("disconnect", onPhantomDisconnect);
            window.phantomEventListenersAttached = true;
        }

        await displaySolBalance();
        await displayTokenBalance(CRL_MINT);

    } catch (err) {
        console.error("Connection error:", err);
        walletStatus.textContent = err.message;
        alert(err.message);
    } finally {
        connectButton.disabled = publicKey !== null;
        disconnectButton.disabled = publicKey === null;
    }
}

async function disconnectWallet() {
    const walletStatus = document.getElementById("walletStatus");
    const connectButton = document.getElementById("connectWallet");
    const disconnectButton = document.getElementById("disconnectWallet");
    const SOLbal = document.getElementById("SOLbal");
    const CRLbal = document.getElementById("CRLbal");
    
    connectButton.style.display = "inline-block";  // show Connect
    disconnectButton.style.display = "none";       // hide Disconnect

    walletStatus.textContent = "Disconnecting...";
 
    try {
        if (!window.solana) throw new Error("Phantom Wallet not found.");
        await window.solana.disconnect();
        onPhantomDisconnect();
        SOLbal.textContent = "SOL Balance: N/A";
        CRLbal.textContent = "CRL Balance: N/A";
    } catch (error) {
        console.error("Disconnection failed:", error);
        walletStatus.textContent = `Disconnection Failed: ${error.message}`;
    } finally {
        connectButton.style.display = "inline-block";  // show Connect
        disconnectButton.style.display = "none";       // hide Disconnect

    }
}

function onPhantomConnect(newPublicKey) {
    publicKey = newPublicKey;
    const walletStatus = document.getElementById("walletStatus");
    const connectButton = document.getElementById("connectWallet");
    const disconnectButton = document.getElementById("disconnectWallet");

    walletStatus.textContent = `Connected: ${publicKey.toString()}`;
    connectButton.style.display = "none";        // hide Connect
    disconnectButton.style.display = "inline-block"; // show Disconnect


    displaySolBalance();
    displayTokenBalance(CRL_MINT);
}

function onPhantomDisconnect() {
    publicKey = null;
    const walletStatus = document.getElementById("walletStatus");
    const connectButton = document.getElementById("connectWallet");
    const disconnectButton = document.getElementById("disconnectWallet");
    const SOLbal = document.getElementById("SOLbal");
    const CRLbal = document.getElementById("CRLbal");

    walletStatus.textContent = "Not connected";
    connectButton.style.display = "inline-block";  // show Connect
    disconnectButton.style.display = "none";       // hide Disconnect
    
    SOLbal.textContent = "SOL Balance: N/A";
    CRLbal.textContent = "CRL Balance: N/A";
}

async function displaySolBalance() {
    const SOLbal = document.getElementById("SOLbal");

    if (!publicKey) {
        SOLbal.textContent = "Balance: Not connected";
        return;
    }

    try {
        const response = await fetch(`${BACKEND_URL}/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                jsonrpc: "2.0",
                id: 1,
                method: "getBalance",
                params: [publicKey.toString()]
            })
        });

        const result = await response.json();
        const lamports = result.result.value;
        const solBalance = lamports / solanaWeb3.LAMPORTS_PER_SOL;
        SOLbal.textContent = `SOL Balance: ${solBalance.toFixed(4)}`;
    } catch (error) {
        console.error("Error fetching SOL balance:", error);
        SOLbal.textContent = "SOL Balance: Error fetching balance";
    }
}

async function displayTokenBalance(tokenMintAddress) {
    const CRLbal = document.getElementById("CRLbal");

    if (!publicKey) {
        CRLbal.textContent = "Balance: Not connected";
        return;
    }

    try {
        
        const response = await fetch(`${BACKEND_URL}/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                jsonrpc: "2.0",
                id: 1,
                method: "getTokenAccountsByOwner",
                params: [
                    publicKey.toString(),
                    { mint: tokenMintAddress },
                    { encoding: "jsonParsed" }
                ]
            })
        });

        const result = await response.json();
        const accounts = result.result.value;

        if (accounts.length === 0) {
            CRLbal.textContent = "CRL Balance: 0.0000";
            return;
        }

        const rawData = accounts[0].account.data;
        const amount = rawData.parsed.info.tokenAmount.uiAmount;
        CRLbal.textContent = `CRL Balance: ${amount.toFixed(4)}`;
    } catch (error) {
        console.error("Error fetching CRL balance:", error);
        CRLbal.textContent = "CRL Balance: Error fetching balance";
    }
}

async function fetchTokenInfo() {
    try {
        const response = await fetch(`${BACKEND_URL}/token-info`);
        const data = await response.json();
        const poolData = data.data.attributes;

        const price = poolData.base_token_price_usd;
        const liquidity = poolData.reserve_in_usd;
        const marketCap = poolData.fdv_usd;

        document.getElementById("Price").textContent = `$${parseFloat(price).toFixed(6)}`;
        document.getElementById("Liquidity").textContent = `$${parseFloat(liquidity).toLocaleString()}`;
        document.getElementById("marketCap").textContent = `$${parseFloat(marketCap).toLocaleString()}`;
        document.getElementById("projectPrice").textContent = `$${parseFloat(marketCap).toLocaleString()}`;


    } catch (error) {
        console.error("Error fetching token info:", error);
    }
}

async function fetchHolderCount() {
    try {
        const response = await fetch(`${BACKEND_URL}/holders`);
        const data = await response.json();
        const holders = data.holders;

        document.getElementById("Holders").textContent = holders;
    } catch (error) {
        console.error('Error fetching holder count:', error);
    }
}



document.addEventListener("DOMContentLoaded", () => {
    const connectButton = document.getElementById("connectWallet");
    const disconnectButton = document.getElementById("disconnectWallet");

    connectButton.addEventListener("click", connectWallet);
    disconnectButton.addEventListener("click", disconnectWallet);

    disconnectButton.disabled = true;

    fetchTokenInfo(); // <<< ADD THIS after setting event listeners
});

