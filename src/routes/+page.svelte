<section>
    <h1>EOS Readonly fetch API</h1>
    <p>
        This API is used to fetch data from EOS blockchain. It will serve you data directly from the blockchain
        into your applications. <b>Please note that there are no sanitizers for the resulting data, so you need to
        sanitize it yourself.</b>
    </p>

    <br />
    <br />
    <h2>Usage</h2>
    <p>
        You can use either the <b>GET</b> or <b>POST</b> method to fetch data from the blockchain. The API will
        attempt to return the data in the correct mime-type based on the data itself, or its prefix-identifier (ie: <u>data:...</u>).

        <br />

    </p>

    <h3>Using GET</h3>
    <p>
        Send your request to https://[this_url]/[your_contract]/[your_action]

        <br />
        You can also add action parameters to a GET request by adding a <b>data</b> parameter to the URL. The data must be
        URL encoded. For example: https://[this_url]/[your_contract]/[your_action]/[your_url_encoded_json_parameters]
    </p>

    <h3>Using POST</h3>
    <p>
        Send your request to https://[this_url]/[your_contract]/[your_action] with the data in the body of the request.
        Body here must be a JSON object.
    </p>


    <h2>Specifying a network</h2>
    <p>
        You can specify a network by passing an <b>x-network</b> header with either <b>mainnet</b> or <b>testnet</b> as the value.
        <br />
        <br />
        You can alternatively pass URL to the <b>x-network</b> header to specify a specific node you want to use.
        <br />
        <br />
        Instead of using a header, you can also use a query parameter <b>network</b> to specify a network.
        Example: https://[this_url]/[your_contract]/[your_action]?network=mainnet
        <br />
        <br />
        If no network is specified, the API will use the EOS mainnet as the default network.
    </p>
</section>

<section>
    <h2>Format parameters</h2>

    <textarea>

    </textarea>
</section>

