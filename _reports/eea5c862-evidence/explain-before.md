# EXPLAIN (ANALYZE, BUFFERS) — الشكل القديم للاستعلام (LIMIT 1000 صف + LIMIT 200 محادثة)

نُفِّذ read-only على قاعدة الإنتاج في ٢٥/١١/٢٠٢٦ بنفس بيانات اليوم (شركة سوان، «المقاسات»، ١٨٠ يوم)
عشان المقارنة تبقى على نفس اللقطة. الأمر:

```
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
WITH matched_messages AS (
    SELECT m."conversationId" FROM messages m
    JOIN conversations c2 ON c2.id = m."conversationId"
    WHERE m.content ILIKE '%المقاسات%' AND m."createdAt" >= now() - interval '180 days'
      AND c2."companyId" = 'cmleybpf70028juo2wwpmp8rt' AND c2.channel = 'FACEBOOK'
    ORDER BY m."createdAt" DESC LIMIT 1000
)
SELECT DISTINCT c.id FROM conversations c
JOIN matched_messages mm ON c.id = mm."conversationId"
WHERE c."companyId" = 'cmleybpf70028juo2wwpmp8rt' AND c.channel = 'FACEBOOK'
LIMIT 200;
```

الناتج الخام:

```
QUERY PLAN                                                                                          
---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
 Limit  (cost=5671.82..5671.98 rows=32 width=25) (actual time=294.047..337.000 rows=200 loops=1)
   Buffers: shared hit=69910 dirtied=3
   ->  Unique  (cost=5671.82..5671.98 rows=32 width=25) (actual time=294.046..336.985 rows=200 loops=1)
         Buffers: shared hit=69910 dirtied=3
         ->  Sort  (cost=5671.82..5671.90 rows=32 width=25) (actual time=294.044..336.932 rows=240 loops=1)
               Sort Key: c.id
               Sort Method: quicksort  Memory: 64kB
               Buffers: shared hit=69910 dirtied=3
               ->  Nested Loop  (cost=5396.29..5671.02 rows=32 width=25) (actual time=284.140..335.722 rows=1000 loops=1)
                     Buffers: shared hit=69907 dirtied=3
                     ->  Limit  (cost=5395.87..5407.60 rows=102 width=34) (actual time=284.121..327.470 rows=1000 loops=1)
                           Buffers: shared hit=65907 dirtied=3
                           ->  Gather Merge  (cost=5395.87..5407.60 rows=102 width=34) (actual time=284.120..327.330 rows=1000 loops=1)
                                 Workers Planned: 1
                                 Workers Launched: 1
                                 Buffers: shared hit=65907 dirtied=3
                                 ->  Sort  (cost=4395.86..4396.11 rows=102 width=34) (actual time=278.307..278.405 rows=756 loops=2)
                                       Sort Key: m."createdAt" DESC
                                       Sort Method: quicksort  Memory: 133kB
                                       Buffers: shared hit=65907 dirtied=3
                                       Worker 0:  Sort Method: quicksort  Memory: 124kB
                                       ->  Nested Loop  (cost=375.55..4392.46 rows=102 width=34) (actual time=41.876..277.569 rows=1138 loops=2)
                                             Buffers: shared hit=65900 dirtied=3
                                             ->  Parallel Bitmap Heap Scan on messages m  (cost=375.13..3100.45 rows=557 width=34) (actual time=36.123..232.373 rows=3902 loops=2)
                                                   Recheck Cond: (content ~~* '%المقاسات%'::text)
                                                   Rows Removed by Index Recheck: 34
                                                   Filter: ("createdAt" >= (now() - '180 days'::interval))
                                                   Rows Removed by Filter: 15695
                                                   Heap Blocks: exact=17304
                                                   Buffers: shared hit=34673
                                                   ->  Bitmap Index Scan on idx_messages_content_trgm  (cost=0.00..374.89 rows=2468 width=0) (actual time=33.448..33.449 rows=39293 loops=1)
                                                         Index Cond: (content ~~* '%المقاسات%'::text)
                                                         Buffers: shared hit=640
                                             ->  Index Scan using conversations_pkey on conversations c2  (cost=0.42..2.32 rows=1 width=25) (actual time=0.011..0.011 rows=0 loops=7804)
                                                   Index Cond: (id = m."conversationId")
                                                   Filter: (("companyId" = 'cmleybpf70028juo2wwpmp8rt'::text) AND (channel = 'FACEBOOK'::text))
                                                   Rows Removed by Filter: 1
                                                   Buffers: shared hit=31224 dirtied=1
                     ->  Index Scan using conversations_pkey on conversations c  (cost=0.42..2.57 rows=1 width=25) (actual time=0.008..0.008 rows=1 loops=1000)
                           Index Cond: (id = m."conversationId")
                           Filter: (("companyId" = 'cmleybpf70028juo2wwpmp8rt'::text) AND (channel = 'FACEBOOK'::text))
                           Buffers: shared hit=4000
 Planning:
   Buffers: shared hit=536
 Planning Time: 5.479 ms
 Execution Time: 337.380 ms
(46 rows)
```
