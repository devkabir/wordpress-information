const wp_meta = document.getElementById('wp-meta');
const wp_plugin = document.getElementById('wp-plugin');
const wp_theme = document.getElementById('wp-theme');
const wp_library = document.getElementById('wp-library');

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {

    const generate_html = (node, collection) => {
        if (Object.entries(collection).length > 0) {
            node.innerHTML = ''
            for (const [key, value] of Object.entries(collection)) {
                let name = key;
                if (typeof value === 'object') {
                    name = get_name(value);
                }
                let anchorDom = document.createElement('li')
                anchorDom.setAttribute('class', 'list-group-item  d-flex justify-content-between align-items-center')
                anchorDom.innerHTML = name
                node.append(anchorDom)
            }
        } else {
            node.innerHTML = 'N/A'
        }
    };


    const get_name = value => {
        let name = makeTitleForSlug(value.name)
        if (value.version && value.version.length < 10) {
            name += ' <strong>' + value.version + '</strong>'
        }
        return name
    };

    const makeTitleForSlug = str => str.replace(/[^a-z0-9]+/gi, '-').toLowerCase().split('-').map(i => i.charAt(0).toUpperCase() + i.slice(1)).join(' ');

    wp_meta.innerHTML = wp_plugin.innerHTML = wp_theme.innerHTML = 'Loading..';
    generate_html(wp_meta, request.metas)
    generate_html(wp_plugin, request.plugins)
    generate_html(wp_theme, request.themes);
    generate_html(wp_library, request.libraries);

});

document.addEventListener('DOMContentLoaded', async function () {


    const helloWordPress = () => {
        let data = {
                metas: {},
                plugins: {},
                themes: {},
                libraries: {},
                packages: {},
            }, metas = document.querySelectorAll("meta[name='generator']"),
            nodes = document.querySelectorAll('link[href], script[src]');
        const extract_libraries = (source, data) => {
            let regex = /\/assets\/(css|js)\/([\w-]+)+/i
            regex = /\/([^\/]+)(?!.*(style|styles|theme|themes|script|scripts))\.min\.js/i
            let match = source.match(regex)
            if (match) {
                console.log(match)
                data['libraries'][match[1]] = {
                    name: match[1]
                }
            }
        };
        const get_data = (node, data, type) => {
            if (node !== null) {

                let plugin_theme_regex = /\/(plugins|themes)\/([a-z0-9-_]+)\/.*?ver=([0-9.]+)/i
                let plugin_theme_match;
                if (node.href !== undefined) {
                    plugin_theme_match = node.href.match(plugin_theme_regex);
                }
                if (node.src !== undefined) {
                    plugin_theme_match = node.src.match(plugin_theme_regex);
                }
                if (plugin_theme_match) {
                    let package_regex = /\/packages\/([a-z0-9-_]+)\/.*?ver=([0-9.]+)/i
                    let package_match = plugin_theme_match[0].match(package_regex)
                    if (package_match !== null) {
                        data['plugins'][package_match[1]] = {
                            name: package_match[1], version: package_match[2]
                        }
                    } else {
                        data[plugin_theme_match[1]][plugin_theme_match[2]] = {
                            name: plugin_theme_match[2], version: plugin_theme_match[3]
                        }
                        extract_libraries(plugin_theme_match[0], data)
                    }
                }
            }
        };

        console.clear()
        nodes.forEach(node => get_data(node, data))
        metas.forEach(meta => data.metas[meta.content] = meta.content)
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
