require 'discourse_api'

client = DiscourseApi::Client.new("http://try.discourse.org")                             #=> specify SSL connection settings if needed
                        #=> Gets a list of new topics
puts client.latest_topics()
puts "Categories\n"
puts client.categories()

puts "Now new topics"
puts client.new_topics()
  #=> Gets a list of new topics
