# Production image for the Daymark API on Render.
# One container runs nginx + php-fpm (HTTP), the queue worker and the
# scheduler, all managed by supervisord.

FROM php:8.5-fpm

COPY --from=mlocati/php-extension-installer:2 /usr/bin/install-php-extensions /usr/local/bin/
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

RUN apt-get update \
    && apt-get install -y --no-install-recommends nginx supervisor unzip \
    && rm -rf /var/lib/apt/lists/* \
    && install-php-extensions pdo_pgsql pgsql gmp bcmath intl opcache pcntl zip

WORKDIR /var/www/html

# Install dependencies first so this layer is cached between code changes.
COPY composer.json composer.lock ./
RUN composer install --no-dev --no-scripts --no-autoloader --prefer-dist --no-interaction

COPY . .
RUN composer dump-autoload --optimize --no-dev \
    && chown -R www-data:www-data storage bootstrap/cache

COPY docker/nginx.conf /etc/nginx/nginx.conf
COPY docker/supervisord.conf /etc/supervisor/conf.d/daymark.conf
COPY docker/php.ini /usr/local/etc/php/conf.d/zz-daymark.ini
COPY docker/php-fpm.conf /usr/local/etc/php-fpm.d/zz-daymark.conf
COPY docker/entrypoint.sh /usr/local/bin/entrypoint.sh
RUN sed -i 's/\r$//' /usr/local/bin/entrypoint.sh && chmod +x /usr/local/bin/entrypoint.sh

# Render routes traffic to port 10000 by default.
EXPOSE 10000

CMD ["/usr/local/bin/entrypoint.sh"]
