const fs = require('fs');
let html = fs.readFileSync('shop.html', 'utf8');

html = html.replace('</article>\n                                </div>\n                            </div>\n                            <div id=\"product_list\" class=\"tab_pane\">', '</article>\n                                    </div>\n                                </div>\n                            </div>\n                            <div id=\"product_list\" class=\"tab_pane\">');

fs.writeFileSync('shop.html', html);
console.log('Fixed div tags');
