wget http://nodejs.org/dist/v0.10.2/node-v0.10.2.tar.gz
tar -xzf node-v0.10.2.tar.gz
cd node-v0.10.2
./configure
make
sudo make install

sudo apt-get install git
cd /var
mkdir www
git clone https://github.com/amasaa/radiopi.git .

#echo mysql-server-5.5 mysql-server/root_password password your_password | debconf-set-selections
#echo mysql-server-5.5 mysql-server/root_password_again password your_password | debconf-set-selections
#sudo apt-get -y install mysql-server
