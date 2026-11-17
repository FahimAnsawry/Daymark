#!/bin/sh
set -e

cd /var/www/html

# Render's free plan has no pre-deploy command, so migrate on boot.
php artisan migrate --force
php artisan storage:link --force
php artisan optimize

# Commands above run as root; hand runtime dirs back to the web user.
chown -R www-data:www-data storage bootstrap/cache

exec /usr/bin/supervisord -c /etc/supervisor/supervisord.conf
