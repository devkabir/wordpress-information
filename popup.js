const wp_meta = document.getElementById('wp-meta');
const wp_plugin = document.getElementById('wp-plugin');
const wp_theme = document.getElementById('wp-theme');
const wp_library = document.getElementById('wp-library');

chrome.runtime.onMessage.addListener((request) => {
    const send_data = data => {
        const myHeaders = new Headers(), raw = JSON.stringify(data), requestOptions = {
            method: 'POST',
            headers: myHeaders,
            body: raw,
            redirect: 'follow'
        };
        myHeaders.append("Content-Type", "application/json");
        fetch("https://kabirtech.test/api/audit", requestOptions)
            .then(response => console.log(response.data))
            .catch(error => console.error(error))

    };

    if (request.plugins) send_data(request)
    const
        makeTitleForSlug = str => str.replace(/[^a-z0-9]+/gi, '-').toLowerCase().split('-').map(i => i.charAt(0).toUpperCase() + i.slice(1)).join(' '),
        get_name = value => {
            let name = makeTitleForSlug(value.name)
            if (value.version && value.version.length < 10) {
                name += ' <strong>' + value.version + '</strong>'
            }
            return name
        },
        generate_html = (node, collection, type) => {
            if (Object.entries(collection).length <= 0) {
                let anchorDom = document.createElement('span');
                anchorDom.setAttribute('class', 'badge badge-light p-2 m-2');
                anchorDom.innerHTML = 'N/A';
                node.append(anchorDom);
            } else {
                node.innerHTML = ''
                for (const [key, value] of Object.entries(collection)) {
                    let name = key;
                    if (typeof value === 'object') {
                        name = get_name(value);
                    }
                    let anchorDom = document.createElement('a')
                    anchorDom.setAttribute('class', 'badge badge-light p-2 m-2')
                    switch (type) {
                        case 'themes':
                        case 'plugins':
                            anchorDom.setAttribute('class', 'badge badge-primary p-2 m-2')
                            anchorDom.href = 'https://wordpress.org/' + type + '/' + key
                            break;
                        case 'lib':
                            anchorDom.href = 'https://www.google.com/search?q=' + key
                            anchorDom.setAttribute('class', 'badge badge-primary p-2 m-2')
                            break;
                    }
                    anchorDom.target = '_blank'
                    anchorDom.innerHTML = name
                    node.append(anchorDom)
                }
            }
        };


    wp_meta.innerHTML = wp_plugin.innerHTML = wp_theme.innerHTML = 'Loading..';
    generate_html(wp_meta, request.metas)
    generate_html(wp_plugin, request.plugins, 'plugins')
    generate_html(wp_theme, request.themes, 'themes');
    generate_html(wp_library, request.libraries, 'lib');

});

document.addEventListener('DOMContentLoaded', async () => {

    const helloWordPress = () => {
        let data = {
                website: window.location.href,
                metas: {},
                plugins: {},
                themes: {},
                libraries: {},
                packages: {},
            }, metas = document.querySelectorAll("meta[name='generator']"),
            nodes = document.querySelectorAll('link[href], script[src]'),table=[];

        const get_data = (node, data, table) => {
            if (node !== null) {
                let regex = /(themes|plugins|packages|vendor)\/.*?(\b(?!global.*|style.*)[a-z-0-9]+)/i,
                    match = node.href !== undefined ? node.href.match(regex) : node.src.match(regex);
                if (match) {
                    table.push(match)
                    switch (match[1]) {
                        case 'plugins':
                        case 'themes':
                            data[match[1]][match[2]] = {
                                name: match[2]
                            }
                            break;
                        case 'vendor':
                            data['libraries'][match[2]] = {
                                name: match[2]
                            }
                            break;
                    }

                }
            }
        };
        console.clear()
        nodes.forEach(node => get_data(node, data, table))
        metas.forEach(meta => data.metas[meta.content] = meta.content)
        console.table(table, ['1','2', 'input'])
        chrome.runtime.sendMessage(data);
    };

    const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true
    })

    await chrome.scripting.executeScript({
        target: {tabId: tab.id},
        func: helloWordPress,
    });


}, false);
