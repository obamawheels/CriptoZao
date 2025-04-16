// ----- Token and Network Configuration -----
const SOL_MINT = "So11111111111111111111111111111111111111112"; // SOL Mint Address
const CRL_MINT = "9AtC4cXKs7XUGCsoxPcEuMeig68MJwHpn6LXQCgF19DY"; // CRL Mint Address
const BACKEND_URL = "http://localhost:3000"; // Change to your deployed backend URL when live

let publicKey = null;

async function connectWallet() {
    const walletStatus = document.getElementById("walletStatus");
    const connectButton = document.getElementById("connectWallet");
    const disconnectButton = document.getElementById("disconnectWallet");
    const graph = document.getElementById("graph");
    const terminal = document.getElementById("integrated-terminal");

    connectButton.disabled = true;
    walletStatus.textContent = "Connecting...";
    graph.style.display = "block";
    terminal.style.display = "block";

    try {
        if (!window.solana || !window.solana.isPhantom) {
            throw new Error("Phantom Wallet not found! Install it from https://phantom.app");
        }

        const provider = window.solana;
        const response = await provider.connect();
        publicKey = response.publicKey;

        walletStatus.textContent = `Connected: ${publicKey.toString()}`;
        connectButton.disabled = true;
        disconnectButton.disabled = false;

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
    const graph = document.getElementById("graph");
    const terminal = document.getElementById("integrated-terminal");

    disconnectButton.disabled = true;
    walletStatus.textContent = "Disconnecting...";
    graph.style.display = "none";
    terminal.style.display = "none";

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
        connectButton.disabled = publicKey !== null;
        disconnectButton.disabled = publicKey === null;
    }
}

function onPhantomConnect(newPublicKey) {
    publicKey = newPublicKey;
    const walletStatus = document.getElementById("walletStatus");
    const connectButton = document.getElementById("connectWallet");
    const disconnectButton = document.getElementById("disconnectWallet");

    walletStatus.textContent = `Connected: ${publicKey.toString()}`;
    connectButton.disabled = true;
    disconnectButton.disabled = false;

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
    connectButton.disabled = false;
    disconnectButton.disabled = true;
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
        const lamports = result.result;
        const solBalance = lamports / solanaWeb3.LAMPORTS_PER_SOL;
        SOLbal.textContent = `SOL Balance: ${solBalance.toFixed(4)}`;
    } catch (error) {
        console.error("Error fetching SOL balance:", error);
        SOLbal.textContent = "Balance: Error fetching balance";
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
                method: "getParsedTokenAccountsByOwner",
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
            CRLbal.textContent = "CRL Balance: 0 (No associated account)";
            return;
        }

        const balance = accounts[0].account.data.parsed.info.tokenAmount.uiAmount;
        CRLbal.textContent = `CRL Balance: ${balance}`;
    } catch (error) {
        console.error("Error fetching CRL balance:", error);
        CRLbal.textContent = "Balance: Error fetching balance";
    }
}

document.addEventListener("DOMContentLoaded", () => {
    const connectButton = document.getElementById("connectWallet");
    const disconnectButton = document.getElementById("disconnectWallet");

    connectButton.addEventListener("click", connectWallet);
    disconnectButton.addEventListener("click", disconnectWallet);

    disconnectButton.disabled = true;
});
